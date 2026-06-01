-- Migration : protéger les colonnes sensibles de la table profiles
-- contre les modifications non autorisées côté client.
--
-- Contexte : les policies RLS UPDATE/INSERT existantes vérifient
-- uniquement que l'utilisateur agit sur sa propre ligne, mais ne
-- restreignent pas les colonnes modifiables. Un utilisateur peut donc
-- s'auto-promouvoir role='dev' (puis appeler grant_coins) ou
-- is_supporter=TRUE (bypass RevenueCat).
--
-- Règle appliquée :
--   - Si auth.uid() IS NOT NULL (appel via JWT user authenticated) :
--       INSERT : les colonnes sensibles sont forcées aux valeurs par défaut
--       UPDATE : toute tentative de modification lève une exception
--   - Si auth.uid() IS NULL (service_role, webhooks, SQL direct) :
--       écriture libre — c'est la voie légitime pour mettre à jour
--       is_supporter (webhook RevenueCat) ou role (admin).
--
-- Colonnes protégées dans cette passe : role, is_supporter.
-- À étendre plus tard à xp, level, total_xp_earned, streak_*, total_prayers
-- une fois que la mise à jour XP passera par un RPC server-side.

BEGIN;

CREATE OR REPLACE FUNCTION public.prevent_privileged_profile_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.role := 'user';
    NEW.is_supporter := FALSE;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'profile column "role" cannot be modified by client'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
    IF NEW.is_supporter IS DISTINCT FROM OLD.is_supporter THEN
      RAISE EXCEPTION 'profile column "is_supporter" cannot be modified by client'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_privileged_profile_changes ON public.profiles;

CREATE TRIGGER prevent_privileged_profile_changes
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_privileged_profile_changes();

COMMIT;
