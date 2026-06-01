-- Migration : sécuriser l'économie de coins contre la falsification client.
--
-- Contexte : les RPC award_coins, award_quiz_session, grant_coins sont
-- exposées à `authenticated`. Avant cette migration, un utilisateur pouvait
-- générer des reference_key arbitraires côté client et se créditer
-- indéfiniment. La seule protection était l'unicité (user_id, reference_key)
-- qui n'empêche que les replays exacts.
--
-- Stratégie appliquée (option A « cap journalier serveur ») :
--
-- 1. award_coins :
--    - quest_*  : 1 crédit max par `reason` par jour calendaire UTC
--                 (count-based, indépendant du format de reference_key)
--    - level_up : pas de cap journalier (peut survenir plusieurs fois par
--                 jour), mais validation stricte du format "level_up:N" et
--                 vérification que profiles.level >= N
--
-- 2. award_quiz_session : cap à 3 sessions par jour calendaire UTC.
--
-- 3. grant_coins : cap MAX_AMOUNT = 1000 côté SQL (en plus de l'edge
--    function), pour empêcher un dev/tester d'appeler le RPC directement
--    avec un montant astronomique.
--
-- Tous les caps utilisent l'idempotence (user_id, reference_key) en plus,
-- donc une retry réseau ne re-crédite pas.

BEGIN;

-- ---------------------------------------------------------------------------
-- award_coins
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.award_coins(
  p_reason TEXT,
  p_reference_key TEXT,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_amount INTEGER;
  v_balance INTEGER;
  v_daily_count INTEGER;
  v_level_in_key INTEGER;
  v_user_level INTEGER;
BEGIN
  IF p_reference_key IS NULL OR length(trim(p_reference_key)) = 0 THEN
    RAISE EXCEPTION 'reference_key is required for award_coins';
  END IF;

  CASE p_reason
    WHEN 'quest_first_prayer_today' THEN v_amount := 3;
    WHEN 'quest_pray_fajr' THEN v_amount := 5;
    WHEN 'quest_pray_all_5' THEN v_amount := 15;
    WHEN 'quest_pray_on_time' THEN v_amount := 8;
    WHEN 'quest_complete_streak_3' THEN v_amount := 20;
    WHEN 'quest_complete_streak_7' THEN v_amount := 50;
    WHEN 'level_up' THEN v_amount := 10;
    ELSE
      RAISE EXCEPTION 'Unsupported reward reason: %', p_reason;
  END CASE;

  -- Validation spécifique level_up : format "level_up:N" et N <= user.level
  IF p_reason = 'level_up' THEN
    IF p_reference_key !~ '^level_up:\d+$' THEN
      RAISE EXCEPTION 'invalid reference_key format for level_up: expected "level_up:N"';
    END IF;
    v_level_in_key :=
      (regexp_match(p_reference_key, '^level_up:(\d+)$'))[1]::INTEGER;
    SELECT level INTO v_user_level
    FROM public.profiles
    WHERE id = p_user_id;
    IF COALESCE(v_user_level, 1) < v_level_in_key THEN
      RAISE EXCEPTION 'user level (%) below claimed level_up (%)',
        v_user_level, v_level_in_key;
    END IF;
  END IF;

  PERFORM public.ensure_user_theme_economy(p_user_id);

  SELECT w.balance INTO v_balance
  FROM public.user_wallet w
  WHERE w.user_id = p_user_id
  FOR UPDATE;

  -- Idempotence : même reference_key → retourne le balance actuel
  IF EXISTS (
    SELECT 1 FROM public.coin_ledger cl
    WHERE cl.user_id = p_user_id
      AND cl.reference_key = p_reference_key
  ) THEN
    RETURN v_balance;
  END IF;

  -- Cap journalier (UTC) : 1 crédit max par reason pour les quest_*
  IF p_reason LIKE 'quest_%' THEN
    SELECT COUNT(*) INTO v_daily_count
    FROM public.coin_ledger
    WHERE user_id = p_user_id
      AND reason = p_reason
      AND created_at >= (NOW() AT TIME ZONE 'UTC')::DATE;

    IF v_daily_count >= 1 THEN
      -- Cap atteint : refuse silencieusement, retourne le balance actuel
      RETURN v_balance;
    END IF;
  END IF;

  v_balance := v_balance + v_amount;

  UPDATE public.user_wallet
  SET balance = v_balance,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  INSERT INTO public.coin_ledger (user_id, delta, balance_after, reason, reference_key)
  VALUES (p_user_id, v_amount, v_balance, p_reason, p_reference_key)
  ON CONFLICT (user_id, reference_key)
  WHERE reference_key IS NOT NULL
  DO NOTHING;

  RETURN v_balance;
END;
$$;

-- ---------------------------------------------------------------------------
-- award_quiz_session
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.award_quiz_session(
  p_session_key TEXT,
  p_amount      INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id         UUID    := auth.uid();
  v_balance         INTEGER;
  v_daily_count     INTEGER;
  v_max_per_session CONSTANT INTEGER := 20;
  v_max_sessions_per_day CONSTANT INTEGER := 3;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_session_key IS NULL OR length(trim(p_session_key)) = 0 THEN
    RAISE EXCEPTION 'session_key is required';
  END IF;

  IF p_amount <= 0 OR p_amount > v_max_per_session THEN
    RAISE EXCEPTION 'amount must be between 1 and %', v_max_per_session;
  END IF;

  PERFORM public.ensure_user_theme_economy(v_user_id);

  SELECT w.balance INTO v_balance
  FROM public.user_wallet w
  WHERE w.user_id = v_user_id
  FOR UPDATE;

  -- Idempotence
  IF EXISTS (
    SELECT 1 FROM public.coin_ledger cl
    WHERE cl.user_id = v_user_id
      AND cl.reference_key = p_session_key
  ) THEN
    RETURN v_balance;
  END IF;

  -- Cap journalier (UTC) : max 3 sessions de quiz par jour
  SELECT COUNT(*) INTO v_daily_count
  FROM public.coin_ledger
  WHERE user_id = v_user_id
    AND reason = 'quiz_correct_answer'
    AND created_at >= (NOW() AT TIME ZONE 'UTC')::DATE;

  IF v_daily_count >= v_max_sessions_per_day THEN
    -- Cap atteint : refuse silencieusement
    RETURN v_balance;
  END IF;

  v_balance := v_balance + p_amount;

  UPDATE public.user_wallet
  SET balance    = v_balance,
      updated_at = NOW()
  WHERE user_id = v_user_id;

  INSERT INTO public.coin_ledger (user_id, delta, balance_after, reason, reference_key)
  VALUES (v_user_id, p_amount, v_balance, 'quiz_correct_answer', p_session_key);

  RETURN v_balance;
END;
$$;

-- ---------------------------------------------------------------------------
-- grant_coins (ajout cap MAX_AMOUNT côté SQL)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.grant_coins(
  p_amount INTEGER,
  p_reason TEXT DEFAULT 'debug_grant',
  p_reference_key TEXT DEFAULT NULL,
  p_target_user_id UUID DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_target UUID;
  v_is_admin BOOLEAN := FALSE;
  v_balance INTEGER;
  v_max_amount CONSTANT INTEGER := 1000;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'p_amount must be positive';
  END IF;

  -- Cap dur même pour les admins (pas de grant > 1000 coins par appel)
  IF p_amount > v_max_amount THEN
    RAISE EXCEPTION 'p_amount exceeds maximum (%)', v_max_amount;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = v_caller
      AND p.role IN ('dev', 'tester')
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Only dev/tester can grant coins';
  END IF;

  v_target := COALESCE(p_target_user_id, v_caller);

  PERFORM public.ensure_user_theme_economy(v_target);

  SELECT w.balance
  INTO v_balance
  FROM public.user_wallet w
  WHERE w.user_id = v_target
  FOR UPDATE;

  IF p_reference_key IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.coin_ledger cl
    WHERE cl.user_id = v_target
      AND cl.reference_key = p_reference_key
  ) THEN
    RETURN v_balance;
  END IF;

  v_balance := v_balance + p_amount;

  UPDATE public.user_wallet
  SET balance = v_balance,
      updated_at = NOW()
  WHERE user_id = v_target;

  INSERT INTO public.coin_ledger (user_id, delta, balance_after, reason, reference_key)
  VALUES (v_target, p_amount, v_balance, p_reason, p_reference_key)
  ON CONFLICT (user_id, reference_key)
  WHERE reference_key IS NOT NULL
  DO NOTHING;

  RETURN v_balance;
END;
$$;

COMMIT;
