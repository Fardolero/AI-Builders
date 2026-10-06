-- award_exchange_credits returns the credits actually written (or already stored)
-- so completion notifications can quote that amount instead of a hardcoded 10.

DROP FUNCTION IF EXISTS public.award_exchange_credits(uuid);

CREATE FUNCTION public.award_exchange_credits(p_exchange_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  e RECORD;
  credit_amount INTEGER := 10;
BEGIN
  SELECT * INTO e FROM public.exchanges WHERE id = p_exchange_id;
  IF e IS NULL OR e.status <> 'completed' THEN
    RETURN NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM public.credit_ledger WHERE exchange_id = p_exchange_id) THEN
    SELECT amount INTO credit_amount
    FROM public.credit_ledger
    WHERE exchange_id = p_exchange_id
    LIMIT 1;
    RETURN credit_amount;
  END IF;

  INSERT INTO public.credit_ledger (user_id, exchange_id, amount, reason)
  VALUES
    (e.proposer_id, p_exchange_id, credit_amount, 'Trueque concretado'),
    (e.owner_id, p_exchange_id, credit_amount, 'Trueque concretado');

  UPDATE public.profiles
  SET
    credits_balance = credits_balance + credit_amount,
    updated_at = timezone('utc'::text, now())
  WHERE id IN (e.proposer_id, e.owner_id);

  RETURN credit_amount;
END;
$$;

REVOKE ALL ON FUNCTION public.award_exchange_credits(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.award_exchange_credits(uuid) TO authenticated, service_role;
