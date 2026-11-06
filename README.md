# Google Sheets Text — Stream Deck plugin

Plugin Stream Deck pour copier dans le presse-papiers des textes partagés dans Google Sheets.

## Fonctionnalités

- **Recherche par ID + langue** : lit les colonnes A (ID), B (Language), C (Texte). Exemple : `Bienvenue / Fra / Bienvenue`.
- **Cellule directe** : récupère une cellule choisie, par exemple `C2`.
- Rafraîchit les données périodiquement et au déclenchement du bouton.
- Colle le texte dans l’application active avec `Ctrl+V` / `Cmd+V`.

## Prérequis

- Stream Deck **6.9 ou plus récent** (manifest ciblant la plateforme actuelle).
- Node.js 20+ pour empaqueter le plugin.
- Une feuille Google Sheets publiée en CSV ou une URL d’export CSV accessible sans authentification. Ne publiez pas de feuille contenant des données privées.

> L’application n’est pas installée sur votre ordinateur par ce dépôt. Le projet contient le code source et le manifeste ; l’archive `.streamDeckPlugin` se construit avec la commande ci-dessous.

## Configurer Google Sheets

Dans Sheets, utilisez une feuille avec la ligne d’en-tête en ligne 1 et les colonnes A/B/C : `ID`, `Language`, `Texte`. Pour permettre la lecture, utilisez **Fichier → Partager → Publier sur le Web**, sélectionnez l’onglet voulu et le format CSV. Copiez l’URL CSV générée. Toute personne ayant cette URL pourra lire les données publiées.

## Installer et construire

1. Téléchargez/clônez le dépôt sur l’ordinateur qui exécute Stream Deck.
2. Dans un terminal, à la racine : `npm install` puis `npm run build`.
3. Ouvrez `com.luna.sheets-text.streamDeckPlugin` généré dans `dist/` pour installer le plugin. Si Stream Deck ne l’ouvre pas directement, double-cliquez sur le fichier.
4. Ajoutez l’action **Google Sheets Text** à une touche.
5. Dans ses propriétés, renseignez l’URL CSV et le mode (recherche ou cellule). Pour la recherche, fournissez l’ID et la langue exacts ; pour cellule, indiquez par exemple `C2`.

La configuration du plugin est enregistrée par bouton dans Stream Deck. Pour plusieurs modérateurs, installez le même plugin et renseignez les mêmes paramètres/URL.

## Développement

`npm run dev` lance le plugin sans empaquetage. Le plugin s’appuie sur le SDK Node officiel Stream Deck.
