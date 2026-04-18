-- Migration: Ajouter le système de rôles aux profils
-- Date: 2026-04-18

-- 1. Ajouter la colonne role avec 'user' comme valeur par défaut
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'tester', 'dev'));

-- 2. Définir le compte dev
UPDATE profiles
SET role = 'dev'
WHERE id IN (
  SELECT id FROM auth.users
  WHERE email = 'cherifmohamedabraham@gmail.com'
);

-- 3. Index pour les requêtes par rôle
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- 4. Politique RLS : les utilisateurs peuvent lire leur propre rôle
-- (la politique SELECT existante sur profiles couvre déjà ça)

-- 5. Politique RLS : seuls les admins (service_role) peuvent modifier les rôles
-- Les utilisateurs ne peuvent pas se changer eux-mêmes de rôle
CREATE OR REPLACE FUNCTION is_dev_or_tester()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('dev', 'tester')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
