BEGIN;

CREATE TABLE IF NOT EXISTS public.theme_catalog (
  id TEXT PRIMARY KEY,
  name_key TEXT NOT NULL,
  description_key TEXT NOT NULL,
  unlock_type TEXT NOT NULL CHECK (unlock_type IN ('free', 'level', 'coins', 'event')),
  unlock_level INTEGER,
  price_coins INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT theme_catalog_unlock_consistency CHECK (
    (unlock_type = 'level' AND unlock_level IS NOT NULL AND unlock_level > 0 AND price_coins IS NULL)
    OR (unlock_type = 'coins' AND price_coins IS NOT NULL AND price_coins >= 0 AND unlock_level IS NULL)
    OR (unlock_type IN ('free', 'event') AND unlock_level IS NULL AND price_coins IS NULL)
  )
);

INSERT INTO public.theme_catalog (id, name_key, description_key, unlock_type, unlock_level, price_coins)
VALUES
  ('default', 'themes.default.name', 'themes.default.desc', 'free', NULL, NULL),
  ('ocean', 'themes.ocean.name', 'themes.ocean.desc', 'level', 3, NULL),
  ('forest', 'themes.forest.name', 'themes.forest.desc', 'level', 6, NULL),
  ('sunset', 'themes.sunset.name', 'themes.sunset.desc', 'coins', NULL, 30),
  ('midnight', 'themes.midnight.name', 'themes.midnight.desc', 'level', 10, NULL),
  ('rose', 'themes.rose.name', 'themes.rose.desc', 'coins', NULL, 50)
ON CONFLICT (id) DO UPDATE
SET
  name_key = EXCLUDED.name_key,
  description_key = EXCLUDED.description_key,
  unlock_type = EXCLUDED.unlock_type,
  unlock_level = EXCLUDED.unlock_level,
  price_coins = EXCLUDED.price_coins,
  is_active = TRUE,
  updated_at = NOW();

CREATE TABLE IF NOT EXISTS public.user_wallet (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_theme_unlocks (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme_id TEXT NOT NULL REFERENCES public.theme_catalog(id) ON DELETE RESTRICT,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source TEXT,
  PRIMARY KEY (user_id, theme_id)
);

CREATE TABLE IF NOT EXISTS public.user_theme_state (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  active_theme_id TEXT NOT NULL REFERENCES public.theme_catalog(id) ON DELETE RESTRICT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.coin_ledger (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delta INTEGER NOT NULL,
  balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
  reason TEXT NOT NULL,
  reference_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS coin_ledger_user_reference_key_uniq
  ON public.coin_ledger (user_id, reference_key)
  WHERE reference_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS coin_ledger_user_created_at_idx
  ON public.coin_ledger (user_id, created_at DESC);

ALTER TABLE public.theme_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_theme_unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_theme_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS theme_catalog_select_policy ON public.theme_catalog;
CREATE POLICY theme_catalog_select_policy
ON public.theme_catalog
FOR SELECT
TO authenticated
USING (is_active = TRUE);

DROP POLICY IF EXISTS wallet_select_own_policy ON public.user_wallet;
CREATE POLICY wallet_select_own_policy
ON public.user_wallet
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS unlocks_select_own_policy ON public.user_theme_unlocks;
CREATE POLICY unlocks_select_own_policy
ON public.user_theme_unlocks
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS theme_state_select_own_policy ON public.user_theme_state;
CREATE POLICY theme_state_select_own_policy
ON public.user_theme_state
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS coin_ledger_select_own_policy ON public.coin_ledger;
CREATE POLICY coin_ledger_select_own_policy
ON public.coin_ledger
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.ensure_user_theme_economy(p_user_id UUID DEFAULT auth.uid())
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_is_admin BOOLEAN := FALSE;
  v_level INTEGER := 1;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_user_id IS NULL THEN
    p_user_id := v_caller;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = v_caller
      AND p.role IN ('dev', 'tester')
  ) INTO v_is_admin;

  IF p_user_id <> v_caller AND NOT v_is_admin THEN
    RAISE EXCEPTION 'Not allowed to access another user economy';
  END IF;

  INSERT INTO public.user_wallet (user_id, balance)
  VALUES (p_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_theme_state (user_id, active_theme_id)
  VALUES (p_user_id, 'default')
  ON CONFLICT (user_id) DO NOTHING;

  SELECT COALESCE(p.level, 1)
  INTO v_level
  FROM public.profiles p
  WHERE p.id = p_user_id;

  INSERT INTO public.user_theme_unlocks (user_id, theme_id, source)
  SELECT p_user_id, tc.id, 'auto_unlock'
  FROM public.theme_catalog tc
  WHERE tc.is_active = TRUE
    AND (
      tc.unlock_type = 'free'
      OR (tc.unlock_type = 'level' AND tc.unlock_level <= v_level)
    )
  ON CONFLICT (user_id, theme_id) DO NOTHING;

  UPDATE public.user_theme_state uts
  SET active_theme_id = 'default', updated_at = NOW()
  WHERE uts.user_id = p_user_id
    AND NOT EXISTS (
      SELECT 1
      FROM public.user_theme_unlocks utu
      WHERE utu.user_id = p_user_id
        AND utu.theme_id = uts.active_theme_id
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_theme_inventory(p_user_id UUID DEFAULT auth.uid())
RETURNS TABLE (
  coins INTEGER,
  active_theme_id TEXT,
  unlocked_theme_ids TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.ensure_user_theme_economy(p_user_id);

  RETURN QUERY
  SELECT
    w.balance AS coins,
    s.active_theme_id,
    COALESCE(array_agg(u.theme_id ORDER BY u.theme_id), ARRAY[]::TEXT[]) AS unlocked_theme_ids
  FROM public.user_wallet w
  JOIN public.user_theme_state s ON s.user_id = w.user_id
  LEFT JOIN public.user_theme_unlocks u ON u.user_id = w.user_id
  WHERE w.user_id = p_user_id
  GROUP BY w.balance, s.active_theme_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.purchase_theme(
  p_theme_id TEXT,
  p_user_id UUID DEFAULT auth.uid(),
  p_reference_key TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  new_balance INTEGER,
  active_theme_id TEXT,
  unlocked_theme_ids TEXT[],
  error_code TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_theme RECORD;
  v_balance INTEGER;
  v_inventory RECORD;
BEGIN
  PERFORM public.ensure_user_theme_economy(p_user_id);

  SELECT *
  INTO v_theme
  FROM public.theme_catalog tc
  WHERE tc.id = p_theme_id
    AND tc.is_active = TRUE;

  IF NOT FOUND THEN
    SELECT * INTO v_inventory FROM public.get_user_theme_inventory(p_user_id);
    RETURN QUERY SELECT FALSE, v_inventory.coins, v_inventory.active_theme_id, v_inventory.unlocked_theme_ids, 'THEME_NOT_FOUND';
    RETURN;
  END IF;

  IF v_theme.unlock_type <> 'coins' OR v_theme.price_coins IS NULL THEN
    SELECT * INTO v_inventory FROM public.get_user_theme_inventory(p_user_id);
    RETURN QUERY SELECT FALSE, v_inventory.coins, v_inventory.active_theme_id, v_inventory.unlocked_theme_ids, 'NOT_PURCHASABLE';
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.user_theme_unlocks utu
    WHERE utu.user_id = p_user_id
      AND utu.theme_id = p_theme_id
  ) THEN
    SELECT * INTO v_inventory FROM public.get_user_theme_inventory(p_user_id);
    RETURN QUERY SELECT FALSE, v_inventory.coins, v_inventory.active_theme_id, v_inventory.unlocked_theme_ids, 'ALREADY_UNLOCKED';
    RETURN;
  END IF;

  SELECT w.balance
  INTO v_balance
  FROM public.user_wallet w
  WHERE w.user_id = p_user_id
  FOR UPDATE;

  IF p_reference_key IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.coin_ledger cl
    WHERE cl.user_id = p_user_id
      AND cl.reference_key = p_reference_key
  ) THEN
    SELECT * INTO v_inventory FROM public.get_user_theme_inventory(p_user_id);
    RETURN QUERY SELECT FALSE, v_inventory.coins, v_inventory.active_theme_id, v_inventory.unlocked_theme_ids, 'ALREADY_PROCESSED';
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.user_theme_unlocks utu
    WHERE utu.user_id = p_user_id
      AND utu.theme_id = p_theme_id
  ) THEN
    SELECT * INTO v_inventory FROM public.get_user_theme_inventory(p_user_id);
    RETURN QUERY SELECT FALSE, v_inventory.coins, v_inventory.active_theme_id, v_inventory.unlocked_theme_ids, 'ALREADY_UNLOCKED';
    RETURN;
  END IF;

  IF v_balance < v_theme.price_coins THEN
    SELECT * INTO v_inventory FROM public.get_user_theme_inventory(p_user_id);
    RETURN QUERY SELECT FALSE, v_inventory.coins, v_inventory.active_theme_id, v_inventory.unlocked_theme_ids, 'INSUFFICIENT_COINS';
    RETURN;
  END IF;

  v_balance := v_balance - v_theme.price_coins;

  UPDATE public.user_wallet
  SET balance = v_balance,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  INSERT INTO public.user_theme_unlocks (user_id, theme_id, source)
  VALUES (p_user_id, p_theme_id, 'purchase')
  ON CONFLICT (user_id, theme_id) DO NOTHING;

  INSERT INTO public.coin_ledger (user_id, delta, balance_after, reason, reference_key)
  VALUES (p_user_id, -v_theme.price_coins, v_balance, 'theme_purchase', p_reference_key)
  ON CONFLICT (user_id, reference_key)
  WHERE reference_key IS NOT NULL
  DO NOTHING;

  SELECT * INTO v_inventory FROM public.get_user_theme_inventory(p_user_id);
  RETURN QUERY SELECT TRUE, v_inventory.coins, v_inventory.active_theme_id, v_inventory.unlocked_theme_ids, NULL::TEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_active_theme(
  p_theme_id TEXT,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.ensure_user_theme_economy(p_user_id);

  IF NOT EXISTS (
    SELECT 1
    FROM public.user_theme_unlocks utu
    WHERE utu.user_id = p_user_id
      AND utu.theme_id = p_theme_id
  ) THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.user_theme_state (user_id, active_theme_id, updated_at)
  VALUES (p_user_id, p_theme_id, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET active_theme_id = EXCLUDED.active_theme_id, updated_at = NOW();

  RETURN TRUE;
END;
$$;

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

  PERFORM public.ensure_user_theme_economy(p_user_id);

  SELECT w.balance
  INTO v_balance
  FROM public.user_wallet w
  WHERE w.user_id = p_user_id
  FOR UPDATE;

  IF EXISTS (
    SELECT 1
    FROM public.coin_ledger cl
    WHERE cl.user_id = p_user_id
      AND cl.reference_key = p_reference_key
  ) THEN
    RETURN v_balance;
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
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'p_amount must be positive';
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

GRANT SELECT ON public.theme_catalog TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_user_theme_economy(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_theme_inventory(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.purchase_theme(TEXT, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_active_theme(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_coins(TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.grant_coins(INTEGER, TEXT, TEXT, UUID) TO authenticated;

COMMIT;
