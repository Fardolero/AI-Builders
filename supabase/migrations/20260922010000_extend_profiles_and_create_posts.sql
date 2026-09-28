-- Extend profiles + create posts (Trocar MVP)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS barrio TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

DO $$ BEGIN
  CREATE TYPE public.post_kind AS ENUM ('objeto', 'servicio');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.post_status AS ENUM ('activa', 'pausada', 'intercambiada');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind public.post_kind NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  looking_for TEXT NOT NULL,
  status public.post_status NOT NULL DEFAULT 'activa',
  barrio TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS posts_status_created_idx ON public.posts (status, created_at DESC);
CREATE INDEX IF NOT EXISTS posts_author_id_idx ON public.posts (author_id);
CREATE INDEX IF NOT EXISTS posts_barrio_idx ON public.posts (barrio);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active posts are viewable by everyone." ON public.posts;
CREATE POLICY "Active posts are viewable by everyone."
  ON public.posts FOR SELECT
  USING (
    status = 'activa'
    OR auth.uid() = author_id
  );

DROP POLICY IF EXISTS "Users can insert their own posts." ON public.posts;
CREATE POLICY "Users can insert their own posts."
  ON public.posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can update their own posts." ON public.posts;
CREATE POLICY "Users can update their own posts."
  ON public.posts FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

GRANT SELECT ON public.posts TO anon, authenticated;
GRANT INSERT, UPDATE ON public.posts TO authenticated;
