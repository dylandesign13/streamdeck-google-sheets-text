import streamDeck, { action, DidReceiveSettingsEvent, KeyDownEvent, SendToPluginEvent, SingletonAction, WillAppearEvent, WillDisappearEvent } from "@elgato/streamdeck";
import type { JsonValue } from "@elgato/streamdeck";
import { execFile } from "node:child_process";

interface Settings {
  csvUrl?: string;
  mode?: "lookup" | "cell";
  id?: string;
  language?: string;
  cell?: string;
  refreshSeconds?: number;
}
type Row = string[];

// Colonnes : A = langue, B = ID, C = texte, D = URL image PNG
const COL_LANGUAGE = 0;
const COL_ID = 1;
const COL_TEXT = 2;
const COL_IMAGE = 3;

// Icône de base utilisée quand la colonne D est vide ou invalide
const DEFAULT_ICON_URL = "https://github.com/dylandesign13/streamdeck-google-sheets-text/blob/main/Images/icons/Black%20Icon.png?raw=true";

// Rafraîchissement automatique de la touche (ms)
const AUTO_REFRESH_MS = 60_000;

const cache = new Map<string, { at: number; rows: Row[] }>();
const timers = new Map<string, NodeJS.Timeout>();

async function fetchRows(url: string, maxAge: number): Promise<Row[]> {
  const saved = cache.get(url);
  if (saved && Date.now() - saved.at < maxAge) return saved.rows;
  const response = await fetch(url, { signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error(`Google Sheets HTTP ${response.status}`);
  const rows = parseCsv(await response.text());
  cache.set(url, { at: Date.now(), rows });
  return rows;
}

function parseCsv(csv: string): Row[] {
  const rows: Row[] = [];
  let row: string[] = [], field = "", quoted = false;
  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i];
    if (quoted) {
      if (ch === '"' && csv[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && csv[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += ch;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function cellValue(rows: Row[], address: string): string {
  const match = /^\$?([A-Z]+)\$?(\d+)$/i.exec(address.trim());
  if (!match) throw new Error("Adresse invalide (ex. C2)");
  const column = [...match[1].toUpperCase()].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1;
  const line = Number(match[2]) - 1;
  return rows[line]?.[column] ?? "";
}

// Liste unique des langues présentes en colonne A (détection automatique)
export function listLanguages(rows: Row[]): string[] {
  const set = new Set<string>();
  for (const r of rows.slice(1)) {
    const lang = (r[COL_LANGUAGE] ?? "").trim();
    if (lang) set.add(lang);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

// Télécharge une image PNG et la renvoie en data URL
async function fetchImageDataUrl(url: string): Promise<string | undefined> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return undefined;
    const base64 = Buffer.from(await response.arrayBuffer()).toString("base64");
    return `data:image/png;base64,${base64}`;
  } catch {
    return undefined;
  }
}

function paste(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const isMac = process.platform === "darwin";
    const command = isMac ? "osascript" : "powershell.exe";
    const args = isMac
      ? ["-e", `set the clipboard to ${JSON.stringify(text)}`, "-e", "tell application \"System Events\" to keystroke \"v\" using {command down}"]
      : ["-NoProfile", "-NonInteractive", "-Command", "Set-Clipboard -Value ([Console]::In.ReadToEnd()); Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('^v')"];
    const child = execFile(command, args, { windowsHide: true }, (error) => error ? reject(error) : resolve());
    if (!isMac) child.stdin?.end(text, "utf8");
  });
}

const DEFAULT_TITLE = "Sheets\nTexte";

// Trouve la ligne correspondant à l'ID (et la langue si renseignée)
function findRow(rows: Row[], id: string, language: string): Row | undefined {
  const wantedId = id.trim().toLocaleLowerCase();
  const wantedLang = language.trim().toLocaleLowerCase();
  return rows.slice(1).find(r =>
    (r[COL_ID] ?? "").trim().toLocaleLowerCase() === wantedId &&
    (r[COL_LANGUAGE] ?? "").trim().toLocaleLowerCase() === wantedLang
  );
}

// Applique le titre (ID) et l'image (colonne D, ou icône de base) sur la touche
async function refreshKey(ev: WillAppearEvent<Settings> | KeyDownEvent<Settings> | DidReceiveSettingsEvent<Settings>, rows?: Row[]) {
  const s = ev.payload.settings;
  if (s.mode !== "cell" && s.id) {
    await ev.action.setTitle(s.id);
  } else {
    await ev.action.setTitle(DEFAULT_TITLE);
  }
  if (!rows || s.mode === "cell") return;
  const row = findRow(rows, s.id ?? "", s.language ?? "");
  const imageUrl = (row?.[COL_IMAGE] ?? "").trim();
  let dataUrl = imageUrl ? await fetchImageDataUrl(imageUrl) : undefined;
  // Repli : icône de base si pas d'URL image ou téléchargement échoué
  if (!dataUrl) dataUrl = await fetchImageDataUrl(DEFAULT_ICON_URL);
  if (dataUrl) await ev.action.setImage(dataUrl);
}

@action({ UUID: "com.luna.sheets-text.copy" })
class CopyText extends SingletonAction<Settings> {
  override async onWillAppear(ev: WillAppearEvent<Settings>) {
    const s = ev.payload.settings;
    let rows: Row[] | undefined;
    if (s.csvUrl) {
      try {
        rows = await fetchRows(s.csvUrl.trim(), 15000);
      } catch (e) {
        streamDeck.logger.error(e instanceof Error ? e.message : String(e));
      }
    }
    await refreshKey(ev, rows);
    this.startAutoRefresh(ev);
  }

  override async onWillDisappear(ev: WillDisappearEvent<Settings>) {
    const timer = timers.get(ev.action.id);
    if (timer) clearInterval(timer);
    timers.delete(ev.action.id);
  }

  // Mise à jour immédiate quand l'ID ou la langue change dans les propriétés
  override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<Settings>) {
    const s = ev.payload.settings;
    let rows: Row[] | undefined;
    if (s.csvUrl) {
      try {
        rows = await fetchRows(s.csvUrl.trim(), 0);
      } catch (e) {
        streamDeck.logger.error(e instanceof Error ? e.message : String(e));
      }
    }
    await refreshKey(ev, rows);
  }

  // Relit le Sheet toutes les minutes (détecte aussi les nouvelles langues)
  private startAutoRefresh(ev: WillAppearEvent<Settings>) {
    const existing = timers.get(ev.action.id);
    if (existing) clearInterval(existing);
    const timer = setInterval(async () => {
      const s = ev.payload.settings;
      if (!s.csvUrl) return;
      try {
        const rows = await fetchRows(s.csvUrl.trim(), 0);
        await refreshKey(ev, rows);
      } catch (e) {
        streamDeck.logger.error(e instanceof Error ? e.message : String(e));
      }
    }, AUTO_REFRESH_MS);
    timers.set(ev.action.id, timer);
  }

  override async onSendToPlugin(ev: SendToPluginEvent<JsonValue, Settings>) {
    const payload = ev.payload as { type?: string; csvUrl?: string; language?: string };
    streamDeck.logger.info(`onSendToPlugin reçu : ${JSON.stringify(payload)}`);
    if (payload?.type !== "getOptions" && payload?.type !== "getLanguages") return;
    const reply = async (data: JsonValue) => {
      try {
        await streamDeck.ui.sendToPropertyInspector(data);
      } catch (e) {
        streamDeck.logger.error(`Envoi vers le panneau impossible : ${e instanceof Error ? e.message : String(e)}`);
      }
    };
    try {
      if (!payload.csvUrl) throw new Error("URL CSV manquante");
      const rows = await fetchRows(payload.csvUrl.trim(), 0);
      if (payload.type === "getLanguages") {
        await reply({ type: "languages", languages: listLanguages(rows) });
        return;
      }
      const wantedLang = (payload.language ?? "").trim().toLocaleLowerCase();
      const options = rows.slice(1)
        .filter(r => (r[COL_ID] ?? "").trim() !== "")
        .filter(r => !wantedLang || (r[COL_LANGUAGE] ?? "").trim().toLocaleLowerCase() === wantedLang)
        .map(r => ({
          language: (r[COL_LANGUAGE] ?? "").trim(),
          id: (r[COL_ID] ?? "").trim(),
          preview: (r[COL_TEXT] ?? "").slice(0, 60),
        }));
      await reply({ type: "options", options });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      streamDeck.logger.error(message);
      await reply({ type: "error", message });
    }
  }

  override async onKeyDown(ev: KeyDownEvent<Settings>) {
    const s = ev.payload.settings;
    try {
      if (!s.csvUrl) throw new Error("Configurez l’URL CSV dans les propriétés");
      const seconds = Math.max(0, Math.min(3600, Number(s.refreshSeconds ?? 15)));
      const rows = await fetchRows(s.csvUrl.trim(), seconds * 1000);
      let text = "";
      if (s.mode === "cell") text = cellValue(rows, s.cell ?? "");
      else {
        const row = findRow(rows, s.id ?? "", s.language ?? "");
        if (!row) throw new Error(`Introuvable : ${s.id ?? "ID"} / ${s.language ?? "langue"}`);
        text = row[COL_TEXT] ?? "";
      }
      if (!text) throw new Error("Texte vide");
      await paste(text);
      await ev.action.showOk();
      await refreshKey(ev, rows);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      streamDeck.logger.error(message);
      await ev.action.showAlert();
      await ev.action.setTitle("Erreur");
      setTimeout(() => { refreshKey(ev).catch(() => {}); }, 3000);
    }
  }
}

streamDeck.actions.registerAction(new CopyText());
streamDeck.connect();
