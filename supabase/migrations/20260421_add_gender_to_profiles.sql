-- Migration: Ajouter le genre utilisateur aux profils
-- Date: 2026-04-21

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS gender_locked BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_gender_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_gender_check
CHECK (gender IS NULL OR gender IN ('male', 'female', 'not_specified'));

CREATE INDEX IF NOT EXISTS idx_profiles_gender ON public.profiles(gender);
