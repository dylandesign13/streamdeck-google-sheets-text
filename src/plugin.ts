import streamDeck, { action, KeyDownEvent, SendToPluginEvent, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";
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

const cache = new Map<string, { at: number; rows: Row[] }>();

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

@action({ UUID: "com.luna.sheets-text.copy" })
class CopyText extends SingletonAction<Settings> {
  override async onWillAppear(ev: WillAppearEvent<Settings>) {
    const s = ev.payload.settings;
    await ev.action.setTitle(s.mode !== "cell" && s.id ? `${s.id}\n${s.language ?? ""}` : DEFAULT_TITLE);
  }

  // Le panneau de configuration demande la liste des ID / langues de la feuille
  override async onSendToPlugin(ev: SendToPluginEvent<JsonValue, Settings>) {
    const payload = ev.payload as { type?: string; csvUrl?: string };
    if (payload?.type !== "getOptions") return;
    try {
      if (!payload.csvUrl) throw new Error("URL CSV manquante");
      const rows = await fetchRows(payload.csvUrl, 0);
      const options = rows.slice(1)
        .filter(r => (r[0] ?? "").trim() !== "")
        .map(r => ({ id: (r[0] ?? "").trim(), language: (r[1] ?? "").trim(), preview: (r[2] ?? "").slice(0, 60) }));
      await streamDeck.ui.sendToPropertyInspector({ type: "options", options });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      streamDeck.logger.error(message);
      await streamDeck.ui.sendToPropertyInspector({ type: "error", message });
    }
  }

  override async onKeyDown(ev: KeyDownEvent<Settings>) {
    const s = ev.payload.settings;
    try {
      if (!s.csvUrl) throw new Error("Configurez l’URL CSV dans les propriétés");
      const seconds = Math.max(0, Math.min(3600, Number(s.refreshSeconds ?? 15)));
      const rows = await fetchRows(s.csvUrl, seconds * 1000);
      let text = "";
      if (s.mode === "cell") text = cellValue(rows, s.cell ?? "");
      else {
        const id = (s.id ?? "").trim().toLocaleLowerCase();
        const language = (s.language ?? "").trim().toLocaleLowerCase();
        const row = rows.slice(1).find(r => (r[0] ?? "").trim().toLocaleLowerCase() === id && (r[1] ?? "").trim().toLocaleLowerCase() === language);
        if (!row) throw new Error(`Introuvable : ${s.id ?? "ID"} / ${s.language ?? "langue"}`);
        text = row[2] ?? "";
      }
      if (!text) throw new Error("Texte vide");
      await paste(text);
      await ev.action.showOk();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      streamDeck.logger.error(message);
      await ev.action.showAlert();
      await ev.action.setTitle("Erreur");
      setTimeout(() => { ev.action.setTitle(DEFAULT_TITLE).catch(() => {}); }, 3000);
    }
  }
}

streamDeck.actions.registerAction(new CopyText());
streamDeck.connect();
