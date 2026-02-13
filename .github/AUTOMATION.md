# Automatisation des releases avec GitHub Actions

Ce workflow automatise la création de releases lorsque vous poussez un tag de version.

## 🚀 Configuration

1. Créer le fichier `.github/workflows/release.yml` :

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    name: Create Release
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Get version from tag
        id: get_version
        run: echo "VERSION=${GITHUB_REF#refs/tags/v}" >> $GITHUB_OUTPUT

      - name: Create Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release v${{ steps.get_version.outputs.VERSION }}
          body_path: RELEASE_NOTES.md
          draft: false
          prerelease: false

  build:
    name: Build with EAS
    runs-on: ubuntu-latest
    needs: release
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Install dependencies
        run: npm install

      - name: Build iOS
        run: eas build --platform ios --profile production --non-interactive

      - name: Build Android
        run: eas build --platform android --profile production --non-interactive
```

## 📝 Secrets requis

Dans GitHub > Settings > Secrets and variables > Actions, ajoutez :

- `EXPO_TOKEN` : Token d'authentification Expo (généré avec `expo login` puis `eas whoami`)

## 🎯 Utilisation

1. Bump la version : `npm run version:minor`
2. Mettre à jour `RELEASE_NOTES.md`
3. Commit et push avec tag :
   ```bash
   git add .
   git commit -m "chore: release v0.2.0"
   git tag v0.2.0
   git push && git push --tags
   ```
4. GitHub Actions s'occupe du reste ! 🎉

## ✅ Ce que fait le workflow

- ✅ Détecte automatiquement les tags `v*`
- ✅ Crée une release GitHub avec le contenu de `RELEASE_NOTES.md`
- ✅ Lance les builds EAS pour iOS et Android
- ✅ Publie les artifacts de build

## 🔄 Workflow alternatif (manuel)

Si vous préférez créer les releases manuellement :

1. Push le tag : `git push --tags`
2. Aller sur GitHub > Releases > New Release
3. Sélectionner le tag
4. Copier le contenu de `RELEASE_NOTES.md`
5. Publier

---

**Note** : L'automatisation complète nécessite un plan Expo payant pour EAS Build.
