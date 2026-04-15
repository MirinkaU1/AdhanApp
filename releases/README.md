# Releases

Ce dossier contient les builds compilés pour chaque version.

## 📦 Contenu

Les fichiers suivants sont générés automatiquement par `npm run release:prepare` :

- `AdhanApp_v{version}.apk` - APK Android (distribution directe)
- `AdhanApp_v{version}.aab` - Android App Bundle (Google Play Store)
- `AdhanApp_v{version}.ipa` - Build iOS (à venir)

## 🚫 Git

Ce dossier est inclus dans `.gitignore` - les fichiers binaires ne sont pas versionnés.

## 📤 Upload

Ces fichiers doivent être attachés manuellement aux releases GitHub :

1. Créer une release sur GitHub
2. Glisser-déposer les fichiers depuis ce dossier
3. Publier

## 🤖 Automatisation

Utilisez GitHub CLI pour automatiser :

```bash
gh release create v0.1.0 releases/* --title "Release v0.1.0" --notes-file GITHUB_RELEASE.md
```
