# Google Sheets Text — Stream Deck plugin

🌐 **Langues / Languages / Языки :** [Français](#français) · [English](#english) · [Русский](#русский)

---

## Français

Plugin Stream Deck qui copie dans le presse-papiers des textes partagés dans Google Sheets, pour synchroniser et centraliser les textes entre plusieurs modérateurs.

### Fonctionnalités

- **Recherche par ID + langue** : lit les colonnes A (Langue), B (ID), C (Texte), D (URL image PNG optionnelle).
- **Cellule directe** : récupère une cellule précise, par exemple `C2`.
- **Mise à jour automatique** : la touche relit le Sheet toutes les minutes et se met à jour dès que vous changez un réglage.
- **Détection des nouvelles langues** automatique.
- Colle le texte dans l’application active (`Ctrl+V` / `Cmd+V`).

### Guide d’utilisation rapide

1. **Préparer le Google Sheet** : ligne 1 = en-têtes, colonnes A/B/C/D = `Langue`, `ID`, `Texte`, `Image` (D facultatif).
2. **Publier la feuille** : *Fichier → Partager → Publier sur le Web*, format **CSV**, puis copiez l’URL.
3. **Installer le plugin** : ouvrez le fichier `com.luna.sheets-text.streamDeckPlugin` (voir *Installation*).
4. **Ajouter la touche** : glissez l’action *Google Sheets Text* sur une touche.
5. **Configurer** : collez l’URL CSV, choisissez le mode.
   - *Recherche* : entrez la langue et l’ID (ex. `Bienvenue` / `Fra`).
   - *Cellule* : entrez l’adresse (ex. `C2`).
6. **Utiliser** : placez le curseur dans le champ de destination, appuyez sur la touche. Le texte est collé.

> ⚠️ Toute personne ayant l’URL publiée peut lire la feuille. Ne mettez pas de données privées.

### Prérequis

- Stream Deck **6.9 ou plus récent**.
- Node.js 20+ (uniquement pour compiler le plugin).

### Installation et compilation

1. Clonez ou téléchargez ce dépôt.
2. À la racine : `npm install` puis `npm run build`.
3. Double-cliquez sur le fichier `.streamDeckPlugin` généré dans `dist/`.

Pour les développeurs : `npm run dev` lance le plugin sans empaquetage.

---

## English

Stream Deck plugin that copies texts stored in a Google Sheet to the clipboard, so moderators can share and centralise the same texts.

### Features

- **Lookup by ID + language**: reads column A (Language), B (ID), C (Text), D (optional PNG image URL).
- **Direct cell**: reads a specific cell, for example `C2`.
- **Automatic refresh**: the key re-reads the Sheet every minute and updates as soon as you change a setting.
- **Automatic detection** of new languages.
- Pastes the text into the active app (`Ctrl+V` / `Cmd+V`).

### Quick user guide

1. **Prepare the Google Sheet**: row 1 = headers, columns A/B/C/D = `Language`, `ID`, `Text`, `Image` (D optional).
2. **Publish the sheet**: *File → Share → Publish to web*, format **CSV**, then copy the URL.
3. **Install the plugin**: open `com.luna.sheets-text.streamDeckPlugin` (see *Installation*).
4. **Add the key**: drag the *Google Sheets Text* action onto a key.
5. **Configure**: paste the CSV URL and choose the mode.
   - *Lookup*: enter the language and the ID (e.g. `Welcome` / `Eng`).
   - *Cell*: enter the address (e.g. `C2`).
6. **Use**: place the cursor where you want the text, press the key. The text is pasted.

> ⚠️ Anyone with the published URL can read the sheet. Do not store private data.

### Requirements

- Stream Deck **6.9 or later**.
- Node.js 20+ (only to build the plugin).

### Installation and build

1. Clone or download this repository.
2. At the root: `npm install` then `npm run build`.
3. Double-click the `.streamDeckPlugin` file generated in `dist/`.

For developers: `npm run dev` runs the plugin without packaging.

---

## Русский

Плагин для Stream Deck, который копирует в буфер обмена тексты из Google Sheets, чтобы модераторы могли делиться одними и теми же текстами.

### Возможности

- **Поиск по ID + языку**: читает колонки A (Язык), B (ID), C (Текст), D (необязательно: URL PNG-изображения).
- **Прямая ячейка**: берёт конкретную ячейку, например `C2`.
- **Автообновление**: кнопка перечитывает таблицу каждую минуту и обновляется сразу после изменения настроек.
- **Автоматическое определение** новых языков.
- Вставляет текст в активное приложение (`Ctrl+V` / `Cmd+V`).

### Краткое руководство

1. **Подготовьте таблицу**: строка 1 — заголовки, колонки A/B/C/D = `Язык`, `ID`, `Текст`, `Изображение` (D необязательна).
2. **Опубликуйте таблицу**: *Файл → Поделиться → Опубликовать в интернете*, формат **CSV**, затем скопируйте URL.
3. **Установите плагин**: откройте файл `com.luna.sheets-text.streamDeckPlugin` (см. *Установка*).
4. **Добавьте кнопку**: перетащите действие *Google Sheets Text* на кнопку.
5. **Настройте**: вставьте URL CSV и выберите режим.
   - *Поиск*: укажите язык и ID (например, `Bienvenue` / `Fra`).
   - *Ячейка*: укажите адрес (например, `C2`).
6. **Используйте**: поставьте курсор туда, куда нужно вставить текст, и нажмите кнопку. Текст будет вставлен.

> ⚠️ Любой, у кого есть опубликованный URL, может читать таблицу. Не храните в ней личные данные.

### Требования

- Stream Deck **6.9 или новее**.
- Node.js 20+ (только для сборки плагина).

### Установка и сборка

1. Клонируйте или скачайте этот репозиторий.
2. В корне выполните: `npm install`, затем `npm run build`.
3. Дважды щёлкните по файлу `.streamDeckPlugin` из папки `dist/`.

Для разработчиков: `npm run dev` запускает плагин без упаковки.