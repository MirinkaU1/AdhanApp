# Gestion des Versions

## 📋 Vue d'ensemble

Le projet utilise un système de versioning centralisé avec **version.json** comme source unique de vérité.

### Fichiers concernés
- `version.json` - Source unique de la version
- `package.json` - Version npm
- `app.json` - Version Expo
- `README.md` - Badge de version

---

## 🚀 Utilisation

### 1. Incrémenter la version

```bash
# Version patch (0.1.0 -> 0.1.1)
npm run version:patch

# Version minor (0.1.0 -> 0.2.0)
npm run version:minor

# Version major (0.1.0 -> 1.0.0)
npm run version:major
```

Ces commandes vont :
- ✅ Mettre à jour `version.json`
- ✅ Synchroniser automatiquement `package.json` et `app.json`
- ✅ Afficher les commandes git suggérées pour commit et tag

### 2. Synchroniser manuellement

Si vous modifiez `version.json` manuellement :

```bash
npm run version:sync
```

---

## 📝 Workflow de release

### Étape 1 : Bump de version

```bash
npm run version:minor
```

### Étape 2 : Mettre à jour RELEASE_NOTES.md

Éditer `RELEASE_NOTES.md` avec les nouvelles fonctionnalités et corrections.

### Étape 3 : Commit et tag

```bash
git add .
git commit -m "chore: release v0.2.0"
git tag v0.2.0
git push && git push --tags
```

### Étape 4 : Créer la release GitHub

1. Aller sur GitHub > Releases > New Release
2. Sélectionner le tag `v0.2.0`
3. Copier le contenu de `RELEASE_NOTES.md`
4. Publier la release

### Étape 5 : Build avec EAS

```bash
# Build production
eas build --platform all --profile production
```

---

## 🔄 Automatisation (optionnel)

Pour automatiser complètement le processus, créez un workflow GitHub Actions (voir `.github/workflows/release.yml`).

---

## 📌 Convention de versioning

Le projet suit le **Semantic Versioning** (SemVer) :

- **MAJOR** (1.0.0) : Changements incompatibles avec les versions précédentes
- **MINOR** (0.1.0) : Ajout de fonctionnalités rétrocompatibles
- **PATCH** (0.0.1) : Corrections de bugs rétrocompatibles

### Exemples

- `0.1.0` → `0.1.1` : Correction de bugs
- `0.1.0` → `0.2.0` : Nouvelles fonctionnalités
- `0.9.0` → `1.0.0` : Première version stable majeure

---

## ⚠️ Important

- Ne jamais modifier directement les versions dans `package.json` ou `app.json`
- Toujours utiliser `version.json` comme source unique
- Mettre à jour `RELEASE_NOTES.md` avant chaque release
- Créer un tag git pour chaque version publiée

---

## 🛠️ Scripts disponibles

| Commande | Description |
|----------|-------------|
| `npm run version:patch` | Incrémente la version patch |
| `npm run version:minor` | Incrémente la version minor |
| `npm run version:major` | Incrémente la version major |
| `npm run version:sync` | Synchronise la version depuis version.json |
