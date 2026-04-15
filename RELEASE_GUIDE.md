# 🚀 Guide de Publication des Releases

Ce guide vous explique comment publier une nouvelle version de l'application avec l'APK.

---

## 📋 Workflow complet

### 1️⃣ Préparer la nouvelle version

```bash
# Incrémenter la version (choisir patch, minor ou major)
npm run version:minor  # Exemple: 0.1.0 → 0.2.0
```

### 2️⃣ Mettre à jour RELEASE_NOTES.md

Éditez `RELEASE_NOTES.md` avec :

- Les nouvelles fonctionnalités
- Les corrections de bugs
- Les changements importants

### 3️⃣ Builder l'APK Android

```bash
cd android
./gradlew assembleRelease
cd ..
```

Ou en une commande :

```bash
npm run release:build
```

### 4️⃣ Préparer les fichiers de release

```bash
npm run release:prepare
```

Cela copie l'APK dans `releases/AdhanApp_v{version}.apk`

### 5️⃣ Commit et tag

```bash
git add .
git commit -m "chore: release v0.2.0"
git tag v0.2.0
git push && git push --tags
```

### 6️⃣ Créer la release sur GitHub

#### Option A : Interface GitHub (Recommandé)

1. Aller sur `https://github.com/MirinkaU1/PrayerApp/releases`
2. Cliquer sur **"Draft a new release"**
3. **Choose a tag** : Sélectionner `v0.2.0`
4. **Release title** : `🌟 AdhanApp v0.2.0`
5. **Description** : Copier le contenu de `GITHUB_RELEASE.md`
6. **Attach binaries** : Glisser-déposer `releases/AdhanApp_v0.2.0.apk`
7. Cocher **"Set as the latest release"**
8. Cliquer sur **"Publish release"**

#### Option B : GitHub CLI (Automatique)

```bash
# Installer GitHub CLI : https://cli.github.com/
gh release create v0.2.0 releases/* \
  --title "🌟 AdhanApp v0.2.0" \
  --notes-file GITHUB_RELEASE.md
```

---

## 📦 Structure des fichiers de release

```
releases/
├── AdhanApp_v0.1.0.apk  (99 MB)
├── AdhanApp_v0.2.0.apk  (100 MB)
└── README.md
```

**Important** : Ces fichiers ne sont PAS versionnés dans Git (listés dans `.gitignore`)

---

## 🔍 Vérification

Après publication, vérifiez :

✅ La release est visible sur `https://github.com/MirinkaU1/PrayerApp/releases`
✅ L'APK est téléchargeable
✅ La version correspond dans `app.json`, `package.json` et le tag
✅ Les notes de version sont complètes

---

## 📱 Tester l'APK

Pour tester l'APK sur un appareil Android :

1. Télécharger l'APK depuis GitHub Releases
2. Activer "Sources inconnues" sur l'appareil Android
3. Installer l'APK
4. Vérifier que la version affichée est correcte

---

## 🔄 Scripts disponibles

| Commande                  | Description                       |
| ------------------------- | --------------------------------- |
| `npm run release:build`   | Build l'APK et prépare la release |
| `npm run release:prepare` | Copie l'APK dans releases/        |
| `npm run version:patch`   | Incrémente la version patch       |
| `npm run version:minor`   | Incrémente la version minor       |
| `npm run version:major`   | Incrémente la version major       |

---

## ⚠️ Points d'attention

### Avant de publier

- [ ] Tester l'app en local
- [ ] Vérifier que tous les tests passent
- [ ] S'assurer que la version est correcte
- [ ] Mettre à jour `RELEASE_NOTES.md`

### Signature de l'APK

Pour une distribution publique ou le Play Store, vous devrez signer l'APK :

```bash
cd android
./gradlew assembleRelease
./gradlew bundleRelease  # Pour l'AAB (Play Store)
```

Configuration de la signature dans `android/app/build.gradle` :

```gradle
android {
    signingConfigs {
        release {
            storeFile file("your-keystore.jks")
            storePassword "your-store-password"
            keyAlias "your-key-alias"
            keyPassword "your-key-password"
        }
    }
}
```

### Google Play Store

Pour publier sur le Play Store, utilisez l'AAB au lieu de l'APK :

```bash
./gradlew bundleRelease
```

L'AAB sera généré dans : `android/app/build/outputs/bundle/release/`

---

## 🎯 Checklist complète

```
[ ] 1. Bump version (npm run version:minor)
[ ] 2. Mettre à jour RELEASE_NOTES.md
[ ] 3. Builder l'APK (npm run release:build)
[ ] 4. Commit et push avec tag
[ ] 5. Créer la release sur GitHub
[ ] 6. Attacher l'APK
[ ] 7. Publier la release
[ ] 8. Tester le téléchargement
```

---

## 💡 Tips

- **Versioning sémantique** : Utilisez patch pour bugfix, minor pour features, major pour breaking changes
- **Beta testing** : Partagez d'abord l'APK avec des testeurs avant la publication officielle
- **Changelog** : Gardez un historique clair des changements dans `RELEASE_NOTES.md`
- **Communication** : Annoncez les nouvelles versions à vos utilisateurs

---

## 🆘 En cas de problème

### L'APK ne se génère pas

```bash
cd android
./gradlew clean
./gradlew assembleRelease --stacktrace
```

### Erreur de signature

Vérifiez que vous avez bien configuré le keystore dans `android/app/build.gradle`

### L'APK est trop volumineux

- Activez ProGuard pour minifier le code
- Utilisez des APK splits par architecture
- Considérez l'AAB qui gère cela automatiquement

---

**Bonne publication ! 🎉**
