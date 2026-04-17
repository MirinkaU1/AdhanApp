-- ========================================
-- MIGRATION: Ajout du champ avatar_id
-- ========================================
-- Cette migration ajoute le support pour les avatars hybrides :
-- - avatar_id : ID de l'avatar prédéfini (01-06)
-- - avatar_url : URL de l'avatar custom uploadé sur Supabase Storage
-- 
-- Exécuter ce SQL dans l'éditeur SQL de Supabase
-- ========================================

-- Ajouter la colonne avatar_id si elle n'existe pas
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_id TEXT;

-- Créer un commentaire pour documentation
COMMENT ON COLUMN public.profiles.avatar_id IS 'ID de l''avatar prédéfini (01-06). Mutuellement exclusif avec avatar_url.';
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL de l''avatar custom uploadé. Mutuellement exclusif avec avatar_id.';

-- Créer un index pour optimiser les recherches par avatar_id
CREATE INDEX IF NOT EXISTS idx_profiles_avatar_id ON public.profiles(avatar_id);

-- Note: Les politiques RLS existantes couvrent déjà cette colonne
-- car elles utilisent "Users can update own profile" sans restriction de colonnes
