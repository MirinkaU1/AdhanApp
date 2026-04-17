# 🚨 FIX : Erreur RLS Upload Avatar

## Problème

```
ERROR ❌ [Avatar] Upload error: [StorageApiError: new row violates row-level security policy]
```

## Cause

Le bucket Supabase Storage `avatars` n'a pas les policies RLS correctes pour autoriser l'upload.

## Solution rapide (3 minutes)

### 1. Aller dans Supabase Dashboard

- Ouvrir votre projet Supabase
- Aller dans **SQL Editor** (icône de base de données)

### 2. Exécuter le SQL de configuration

- Cliquer sur **+ New query**
- Copier-coller TOUT le contenu du fichier : [`docs/supabase-storage-policies.sql`](./supabase-storage-policies.sql)
- Cliquer sur **Run** (ou F5)

### 3. Vérifier la création

Vous devriez voir en résultat :

```
INSERT 1 (bucket créé ou déjà existant)
DROP POLICY (nettoyage)
CREATE POLICY × 4 (policies créées)
```

La dernière requête SELECT affichera toutes les policies créées.

### 4. Tester l'upload

- Relancer l'app
- Essayer d'uploader un avatar personnalisé
- ✅ Ça devrait fonctionner maintenant !

## Que font ces policies ?

1. **Avatar insert for user** : Autorise les utilisateurs authentifiés à uploader dans `avatars/{leur_user_id}/...`
2. **Public avatar access** : Permet à tout le monde de voir les avatars (lecture publique)
3. **Users can update own avatar** : Autorise la modification de ses propres avatars
4. **Users can delete own avatar** : Autorise la suppression de ses propres avatars

## Vérification manuelle (optionnel)

Si vous voulez vérifier manuellement dans l'interface :

1. Aller dans **Storage** → **Policies**
2. Sélectionner la table `objects`
3. Vous devriez voir 4 policies avec "avatar" dans le nom
4. Vérifier que la policy INSERT a : `bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text`

## Dépannage

### Le bucket n'existe pas

Si l'erreur dit "bucket not found" :

1. Aller dans **Storage**
2. Cliquer **New bucket**
3. Nom : `avatars`
4. **Public bucket** : ☑️ Coché
5. Puis exécuter le SQL des policies

### Les policies ne se créent pas

- Vérifier que vous avez les droits d'administration
- Essayer de supprimer manuellement les policies existantes via l'interface
- Re-exécuter le SQL

### L'erreur persiste après fix

1. Vérifier le chemin d'upload : `{user_id}/avatar-custom.{ext}`
2. Vérifier que l'utilisateur est bien authentifié (`auth.uid()` non null)
3. Check les logs Storage dans **Logs** → **Storage**
