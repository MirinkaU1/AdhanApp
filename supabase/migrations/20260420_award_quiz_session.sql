-- Fonction pour attribuer les pièces d'une session quiz à l'utilisateur connecté.
-- Accessible à tous les utilisateurs authentifiés (pas seulement dev/tester).
-- Protection anti-hack : cap à 20 pièces (10 questions × 2 pièces), idempotente via session_key.

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
  v_max_per_session CONSTANT INTEGER := 20; -- QUESTIONS_PER_QUIZ * COINS_PER_CORRECT
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

  SELECT w.balance
  INTO v_balance
  FROM public.user_wallet w
  WHERE w.user_id = v_user_id
  FOR UPDATE;

  -- Idempotency : même session_key → retourner le solde sans double crédit
  IF EXISTS (
    SELECT 1
    FROM public.coin_ledger cl
    WHERE cl.user_id = v_user_id
      AND cl.reference_key = p_session_key
  ) THEN
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

GRANT EXECUTE ON FUNCTION public.award_quiz_session(TEXT, INTEGER) TO authenticated;
