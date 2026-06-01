-- Migration : ajout des thèmes à motifs dans theme_catalog
-- Correspond aux thèmes définis dans constants/appThemes.ts

BEGIN;

INSERT INTO public.theme_catalog
  (id, name_key, description_key, unlock_type, unlock_level, price_coins)
VALUES
  ('golden',   'themes.golden.name',   'themes.golden.desc',   'coins', NULL, 40),
  ('lattice',  'themes.lattice.name',  'themes.lattice.desc',  'coins', NULL, 60),
  ('starnight','themes.starnight.name','themes.starnight.desc','level',  8,   NULL)
ON CONFLICT (id) DO UPDATE
SET
  name_key        = EXCLUDED.name_key,
  description_key = EXCLUDED.description_key,
  unlock_type     = EXCLUDED.unlock_type,
  unlock_level    = EXCLUDED.unlock_level,
  price_coins     = EXCLUDED.price_coins,
  updated_at      = NOW();

COMMIT;
