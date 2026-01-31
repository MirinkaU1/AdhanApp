-- Migration: Créer la table quran_progress
-- Date: 2026-01-31

-- Créer la table quran_progress si elle n'existe pas
CREATE TABLE IF NOT EXISTS quran_progress (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  progress JSONB DEFAULT '{}'::jsonb,
  stats JSONB DEFAULT '{
    "totalReadingTime": 0,
    "totalVersesRead": 0,
    "totalSurahsRead": 0,
    "currentStreak": 0,
    "lastReadDate": null
  }'::jsonb,
  last_position JSONB DEFAULT null,
  favorite_verses JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT one_progress_per_user UNIQUE (user_id)
);

-- Activer RLS (Row Level Security)
ALTER TABLE quran_progress ENABLE ROW LEVEL SECURITY;

-- Politique: les utilisateurs peuvent voir leurs propres données
CREATE POLICY "Users can view own quran_progress" ON quran_progress
  FOR SELECT
  USING (auth.uid() = user_id);

-- Politique: les utilisateurs peuvent modifier leurs propres données
CREATE POLICY "Users can update own quran_progress" ON quran_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Politique: les utilisateurs peuvent insérer leurs propres données
CREATE POLICY "Users can insert own quran_progress" ON quran_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_quran_progress_user_id ON quran_progress(user_id);
