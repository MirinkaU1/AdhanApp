-- Migration : ajouter WITH CHECK aux policies UPDATE des tables
-- quran_progress et quiz_progress (et toute autre policy laxiste qu'on
-- aurait laissée en place). Sans WITH CHECK, un user peut UPDATE sa
-- propre ligne et muter user_id vers un autre id ; bloqué en pratique
-- par les contraintes UNIQUE, mais c'est une faiblesse RLS qu'il faut
-- fermer par hygiène.

BEGIN;

-- ---------------------------------------------------------------------------
-- quran_progress
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can update own quran_progress" ON public.quran_progress;
CREATE POLICY "Users can update own quran_progress"
  ON public.quran_progress
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- quiz_progress
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can update own quiz_progress" ON public.quiz_progress;
CREATE POLICY "Users can update own quiz_progress"
  ON public.quiz_progress
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMIT;
