# Système Hybride d'Avatars - Documentation

## 📋 Vue d'ensemble

Le système d'avatars utilise une approche hybride pour gérer deux types d'avatars :

1. **Avatars prédéfinis** : 6 avatars préchargés dans l'app (stockés en local)
2. **Avatars personnalisés** : Photos uploadées par l'utilisateur sur Supabase Storage

## 🏗️ Architecture

### Champs de base de données

La table `profiles` contient deux champs mutuellement exclusifs :

- `avatar_id` (TEXT) : ID de l'avatar prédéfini (valeurs : "01" à "06")
- `avatar_url` (TEXT) : URL de l'avatar custom depuis Supabase Storage

**Règle importante** : Un seul de ces deux champs peut être défini à la fois.

### Fichiers modifiés

#### 1. `lib/avatarService.ts` (nouveau)

Service centralisé pour la gestion des avatars.

**Fonctions principales** :

- `selectPresetAvatar(userId, avatarId)` - Sélectionne un avatar prédéfini
- `uploadCustomAvatar(imageUri, userId)` - Upload un avatar personnalisé
- `removeAvatar(userId)` - Supprime l'avatar actuel
- `getAvatarSource(avatar_id, avatar_url)` - Retourne la source Image appropriée

**Constantes** :

- `PRESET_AVATARS` - Array de 6 avatars avec `id` et `source: require()`

#### 2. `app/settings/profile.tsx`

Écran de profil refactorisé pour utiliser `avatarService`.

**Changements** :

- `avatarUri` → `avatarSource` (supporte URI et require())
- `pickImage()` utilise `uploadCustomAvatar()`
- `handleSelectAvatar()` → `handleSelectPresetAvatar()` utilise le service
- `handleRemoveAvatar()` utilise `removeAvatar()`
- `AvatarDrawer` reçoit `PRESET_AVATARS` au lieu d'URIs

#### 3. `stores/useAuthStore.ts`

Store d'authentification étendu pour supporter les deux types d'avatars.

**Interface User** :

```typescript
export interface User {
  // ... autres champs
  avatar?: string; // Legacy - compatibilité
  avatar_id?: string; // ID avatar prédéfini (01-06)
  avatar_url?: string; // URL avatar custom
}
```

**Fonction updateProfile** :

```typescript
updateProfile: async (data: {
  name?: string;
  avatar?: string | null; // Legacy
  avatar_id?: string | null; // Nouveau
  avatar_url?: string | null; // Nouveau
  birthDate?: string;
})
```

Logique :

- Si `avatar_id` fourni → set `avatar_id`, clear `avatar_url`
- Si `avatar_url` fourni → set `avatar_url`, clear `avatar_id`
- Si `avatar` fourni (legacy) → traité comme `avatar_url`

## 🗄️ Configuration Supabase

### ⚠️ IMPORTANT : Erreur RLS Upload

Si vous avez l'erreur **"new row violates row-level security policy"**, suivez le guide : [FIX-AVATAR-RLS-ERROR.md](./FIX-AVATAR-RLS-ERROR.md)

**TL;DR** : Exécuter [`supabase-storage-policies.sql`](./supabase-storage-policies.sql) dans l'éditeur SQL Supabase.

---

### 1. Migration SQL

Exécuter le fichier `docs/migration-add-avatar-id.sql` dans l'éditeur SQL Supabase :

```sql
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_id TEXT;
```

### 2. Bucket Storage + Policies RLS

**Option A : Utiliser le SQL automatique (RECOMMANDÉ)**

Exécuter [`docs/supabase-storage-policies.sql`](./supabase-storage-policies.sql) dans l'éditeur SQL Supabase. Ce script :

- Crée le bucket `avatars` (public)
- Configure les 4 policies RLS nécessaires
- Vérifie la création avec un SELECT final

**Option B : Configuration manuelle**

1. **Créer le bucket** :
   - Aller dans **Storage** → **Create bucket**
   - Nom : `avatars`
   - **Public bucket** : ☑️ Coché
   - **File size limit** : 5MB recommandé

2. **Configurer les policies** :
   Voir le contenu du fichier SQL ci-dessus pour les 4 policies à créer manuellement.

### 3. Vérification

Après configuration, vérifier dans **Storage** → **Policies** → table `objects` :

- ✅ 4 policies avec "avatar" dans le nom
- ✅ INSERT policy vérifie `auth.uid()` = premier dossier du path
- ✅ SELECT policy autorise l'accès public

---

## 🧪 Tests à effectuer

### Test 1 : Sélection d'avatar prédéfini

1. Ouvrir l'écran Profil
2. Cliquer sur l'avatar actuel
3. Sélectionner un des 6 avatars prédéfinis
4. Vérifier que l'avatar s'affiche correctement
5. **Build test** : Créer un build production et tester à nouveau

**Résultat attendu** :

- Pas d'erreur "Format d'URI non supporté"
- Pas d'erreur "Network request failed"
- Avatar s'affiche instantanément (pas de chargement réseau)

### Test 2 : Upload d'avatar personnalisé

1. Ouvrir l'écran Profil
2. Cliquer sur "Prendre une photo" ou "Choisir dans la galerie"
3. Sélectionner une image
4. Vérifier l'upload et l'affichage

**Résultat attendu** :

- Image uploadée dans Supabase Storage sous `avatars/{userId}/{timestamp}.jpg`
- Avatar custom s'affiche correctement
- Les avatars prédéfinis restent accessibles dans le drawer

### Test 3 : Suppression d'avatar

1. Avoir un avatar (prédéfini ou custom)
2. Cliquer sur l'avatar → "Supprimer l'avatar"
3. Vérifier que l'avatar par défaut s'affiche

**Résultat attendu** :

- `avatar_id` et `avatar_url` = null dans la base
- Affichage d'un avatar placeholder ou première lettre du nom

### Test 4 : Basculement entre types

1. Sélectionner un avatar prédéfini (ex: 01)
2. Uploader un avatar custom
3. Vérifier que seul `avatar_url` est set (avatar_id = null)
4. Re-sélectionner un avatar prédéfini
5. Vérifier que seul `avatar_id` est set (avatar_url = null)

**Résultat attendu** :

- Les deux types sont mutuellement exclusifs
- Pas de "fuite" de données entre les deux champs

## 🐛 Debugging

### Problème : "Format d'URI non supporté"

**Cause** : Asset URI sans protocole (ex: `assets_images_avatars_02...`)

**Solution** :

- Les avatars prédéfinis utilisent maintenant `require()` directement
- Pas de conversion URI nécessaire
- Vérifier que `getAvatarSource()` retourne `{ uri }` ou `number` (require)

### Problème : "Network request failed"

**Cause** : Tentative de charger un asset comme une URL réseau

**Solution** :

- Utiliser `Image.resolveAssetSource()` uniquement pour URIs externes
- Les `require()` sont gérés nativement par React Native Image

### Problème : Avatar ne s'affiche pas après upload

**Cause possible** :

1. Bucket Supabase n'existe pas
2. Policies RLS bloquent l'accès
3. URL incorrecte

**Debug** :

```typescript
console.log("Avatar URL:", avatarUrl);
console.log(
  "Supabase Storage URL:",
  supabase.storage.from("avatars").getPublicUrl(path),
);
```

## 📝 Checklist de déploiement

- [ ] Migration SQL exécutée dans Supabase
- [ ] Bucket `avatars` créé et configuré
- [ ] Storage policies RLS configurées (si bucket non-public)
- [ ] Tests en dev mode réussis
- [ ] **Tests en build production réussis** (critique !)
- [ ] Code compilé sans erreurs TypeScript
- [ ] Documentation mise à jour

## 🚀 Prochaines étapes (optionnel)

- [ ] Compression d'images avant upload (ex: expo-image-manipulator)
- [ ] Cache des avatars custom pour performances
- [ ] Limite de taille d'upload côté client (ex: 5MB max)
- [ ] Validation du format d'image (JPEG, PNG, WebP uniquement)
- [ ] Rotation/crop d'image avant upload
- [ ] Purge automatique des anciens avatars lors du changement
