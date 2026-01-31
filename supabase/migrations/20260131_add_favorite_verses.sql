-- Migration: Ajouter favorite_verses à quran_progress
-- Date: 2026-01-31

-- Ajouter la colonne favorite_verses (JSONB pour stocker les versets favoris)
ALTER TABLE quran_progress
ADD COLUMN IF NOT EXISTS favorite_verses JSONB DEFAULT '[]'::jsonb;

-- Vérifier que la table existe et que les colonnes nécessaires sont présentes
-- La table quran_progress devrait déjà contenir:
-- - user_id (UUID, FK vers auth.users)
-- - progress (JSONB)
-- - stats (JSONB)
-- - last_position (JSONB)
-- - updated_at (TIMESTAMPTZ)

-- Activer RLS (Row Level Security) si pas encore fait
ALTER TABLE quran_progress ENABLE ROW LEVEL SECURITY;

-- Politique pour que les utilisateurs ne puissent voir que leurs propres données
DROP POLICY IF EXISTS "Users can view own quran_progress" ON quran_progress;
CREATE POLICY "Users can view own quran_progress" ON quran_progress
  FOR SELECT
  USING (auth.uid() = user_id);

-- Politique pour que les utilisateurs puissent modifier leurs propres données
DROP POLICY IF EXISTS "Users can update own quran_progress" ON quran_progress;
CREATE POLICY "Users can update own quran_progress" ON quran_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own quran_progress" ON quran_progress;
CREATE POLICY "Users can insert own quran_progress" ON quran_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
