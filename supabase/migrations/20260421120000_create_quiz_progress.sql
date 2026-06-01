-- Migration: Créer la table quiz_progress
-- Date: 2026-04-21

CREATE TABLE IF NOT EXISTS quiz_progress (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stats JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT one_quiz_progress_per_user UNIQUE (user_id)
);

ALTER TABLE quiz_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quiz_progress" ON quiz_progress
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own quiz_progress" ON quiz_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz_progress" ON quiz_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_quiz_progress_user_id ON quiz_progress(user_id);
