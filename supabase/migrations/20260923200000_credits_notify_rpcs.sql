-- Version RPCs in repo + bump credits to +10 (illustrative userflow value)
-- Idempotent: CREATE OR REPLACE

CREATE OR REPLACE FUNCTION public.notify_user(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_body text,
  p_href text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, href)
  VALUES (p_user_id, p_type, p_title, p_body, p_href);
END;
$$;

CREATE OR REPLACE FUNCTION public.award_exchange_credits(p_exchange_id uuid)
RETURNS void
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
    RETURN;
  END IF;

  IF EXISTS (SELECT 1 FROM public.credit_ledger WHERE exchange_id = p_exchange_id) THEN
    RETURN;
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
END;
$$;

REVOKE ALL ON FUNCTION public.notify_user(uuid, text, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.award_exchange_credits(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.notify_user(uuid, text, text, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.award_exchange_credits(uuid) TO authenticated, service_role;
