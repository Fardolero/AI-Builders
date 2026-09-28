-- Proposer's offer post, and contact flags copied from auth (not onboarding).

ALTER TABLE public.exchanges
  ADD COLUMN IF NOT EXISTS offer_post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS phone_confirmed_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.stamp_profile_contact_confirmation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TIMESTAMPTZ;
  v_phone TIMESTAMPTZ;
BEGIN
  SELECT u.email_confirmed_at, u.phone_confirmed_at
    INTO v_email, v_phone
  FROM auth.users AS u
  WHERE u.id = NEW.id;

  NEW.email_confirmed_at := v_email;
  NEW.phone_confirmed_at := v_phone;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_stamp_contact_confirmation ON public.profiles;
CREATE TRIGGER profiles_stamp_contact_confirmation
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.stamp_profile_contact_confirmation();

CREATE OR REPLACE FUNCTION public.sync_profile_contact_from_auth()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET
    email_confirmed_at = NEW.email_confirmed_at,
    phone_confirmed_at = NEW.phone_confirmed_at
  WHERE id = NEW.id
    AND (
      email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at
      OR phone_confirmed_at IS DISTINCT FROM NEW.phone_confirmed_at
    );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_contact_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_contact_confirmed
  AFTER UPDATE OF email_confirmed_at, phone_confirmed_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_contact_from_auth();

UPDATE public.profiles AS p
SET
  email_confirmed_at = u.email_confirmed_at,
  phone_confirmed_at = u.phone_confirmed_at
FROM auth.users AS u
WHERE p.id = u.id;

REVOKE ALL ON FUNCTION public.stamp_profile_contact_confirmation() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.stamp_profile_contact_confirmation() TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.sync_profile_contact_from_auth() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_profile_contact_from_auth() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_profile_contact_from_auth() TO postgres, service_role;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_auth_admin') THEN
    GRANT EXECUTE ON FUNCTION public.sync_profile_contact_from_auth() TO supabase_auth_admin;
  END IF;
END $$;
