-- ========================================
-- CONFIGURATION STORAGE : Bucket avatars
-- ========================================
-- Ce fichier configure le bucket avatars et ses policies RLS
-- Exécuter ce SQL dans l'éditeur SQL de Supabase
-- ========================================

-- 1. CRÉER LE BUCKET (si inexistant)
-- Note: Vous pouvez aussi le créer via l'interface Supabase Storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. SUPPRIMER LES POLICIES EXISTANTES (éviter les conflits)
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Avatar insert for user" ON storage.objects;

-- 3. POLICY INSERT : Les utilisateurs peuvent uploader dans leur propre dossier
-- Chemin requis: avatars/{user_id}/{filename}
CREATE POLICY "Avatar insert for user"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. POLICY SELECT : Lecture publique de tous les avatars
-- Permet d'afficher les avatars sans authentification
CREATE POLICY "Public avatar access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- 5. POLICY UPDATE : Les utilisateurs peuvent modifier leurs propres avatars
CREATE POLICY "Users can update own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 6. POLICY DELETE : Les utilisateurs peuvent supprimer leurs propres avatars
CREATE POLICY "Users can delete own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 7. VÉRIFICATION : Afficher les policies créées
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%avatar%'
ORDER BY policyname;
