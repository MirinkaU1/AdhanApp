-- =============================================================================
-- MIGRATION: Ajout des statistiques de suivi
-- =============================================================================
-- Exécutez ce SQL dans votre Supabase SQL Editor pour ajouter les colonnes manquantes
-- =============================================================================

-- Ajouter la colonne total_xp_earned si elle n'existe pas
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS total_xp_earned INTEGER DEFAULT 0;

-- Ajouter la colonne total_prayers si elle n'existe pas
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS total_prayers INTEGER DEFAULT 0;

-- =============================================================================
-- FONCTION: Calculer le total de prières à partir des daily_logs
-- =============================================================================

CREATE OR REPLACE FUNCTION public.calculate_total_prayers(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_total INTEGER := 0;
BEGIN
    SELECT  
        COALESCE(SUM(
            CASE WHEN fajr THEN 1 ELSE 0 END +
            CASE WHEN dhuhr THEN 1 ELSE 0 END +
            CASE WHEN asr THEN 1 ELSE 0 END +
            CASE WHEN maghrib THEN 1 ELSE 0 END +
            CASE WHEN isha THEN 1 ELSE 0 END
        ), 0)
    INTO v_total
    FROM public.daily_logs 
    WHERE user_id = p_user_id;
    
    -- Mettre à jour le profil
    UPDATE public.profiles 
    SET total_prayers = v_total
    WHERE id = p_user_id;
    
    RETURN v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Donner les permissions
GRANT EXECUTE ON FUNCTION public.calculate_total_prayers(UUID) TO authenticated;

-- =============================================================================
-- FONCTION: Mettre à jour les stats après modification des daily_logs
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_prayer_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculer la streak
    PERFORM public.calculate_streak(NEW.user_id);
    
    -- Calculer le total de prières
    PERFORM public.calculate_total_prayers(NEW.user_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour mettre à jour les stats après chaque modification
DROP TRIGGER IF EXISTS trigger_update_prayer_stats ON public.daily_logs;
CREATE TRIGGER trigger_update_prayer_stats
    AFTER INSERT OR UPDATE ON public.daily_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_prayer_stats();

-- =============================================================================
-- VÉRIFICATION: Afficher la structure de la table profiles
-- =============================================================================
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'profiles' AND table_schema = 'public';
