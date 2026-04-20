-- Migration : ajout du thème arabesque dans theme_catalog
-- Thème exclusif Ramadan (type = event, eventId = ramadan)

BEGIN;

INSERT INTO public.theme_catalog
  (id, name_key, description_key, unlock_type, unlock_level, price_coins)
VALUES
  ('arabesque', 'themes.arabesque.name', 'themes.arabesque.desc', 'event', NULL, NULL)
ON CONFLICT (id) DO UPDATE
SET
  name_key        = EXCLUDED.name_key,
  description_key = EXCLUDED.description_key,
  unlock_type     = EXCLUDED.unlock_type,
  unlock_level    = EXCLUDED.unlock_level,
  price_coins     = EXCLUDED.price_coins,
  updated_at      = NOW();

COMMIT;
