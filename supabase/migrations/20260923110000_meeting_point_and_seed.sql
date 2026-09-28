-- Meeting points on posts + coastal barrio + seed counterpart for propose/chat

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS meeting_point_id TEXT;

CREATE INDEX IF NOT EXISTS posts_meeting_point_id_idx
  ON public.posts (meeting_point_id);

UPDATE public.profiles
SET
  barrio = 'Centro MdP',
  updated_at = timezone('utc'::text, now())
WHERE barrio IS NULL
   OR barrio NOT IN (
     'Centro MdP',
     'Playa Grande',
     'Chapadmalal',
     'Santa Clara del Mar',
     'Miramar'
   );

-- Seed counterpart user (for propose/chat smoke). Idempotent by email.
DO $$
DECLARE
  seed_id uuid := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  test_id uuid := '61f71eb3-6065-411c-a4b7-3dbb47d18bc3';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = seed_id) THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      seed_id,
      'authenticated',
      'authenticated',
      'seed-vecino@trocar.local',
      crypt('SeedTrocar2026!', gen_salt('bf')),
      timezone('utc'::text, now()),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Martina Seed"}'::jsonb,
      timezone('utc'::text, now()),
      timezone('utc'::text, now()),
      '',
      '',
      '',
      ''
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE user_id = seed_id
  ) THEN
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      seed_id,
      seed_id,
      format('{"sub":"%s","email":"seed-vecino@trocar.local"}', seed_id)::jsonb,
      'email',
      seed_id::text,
      timezone('utc'::text, now()),
      timezone('utc'::text, now()),
      timezone('utc'::text, now())
    );
  END IF;

  INSERT INTO public.profiles (
    id,
    full_name,
    barrio,
    bio,
    credits_balance,
    interests,
    onboarding_completed_at,
    updated_at
  ) VALUES (
    seed_id,
    'Martina Seed',
    'Centro MdP',
    'Vecina seed para demos de trueque en el corredor MdP–Miramar.',
    18,
    ARRAY['Plantas', 'Libros', 'Hogar'],
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    barrio = EXCLUDED.barrio,
    bio = EXCLUDED.bio,
    onboarding_completed_at = COALESCE(public.profiles.onboarding_completed_at, EXCLUDED.onboarding_completed_at),
    updated_at = timezone('utc'::text, now());

  -- Seed posts from Martina (ajenos al test user) — idempotent by title+author
  INSERT INTO public.posts (
    author_id, kind, title, description, looking_for, barrio, status, meeting_point_id
  )
  SELECT seed_id, v.kind::public.post_kind, v.title, v.description, v.looking_for, v.barrio, 'activa'::public.post_status, v.meeting_point_id
  FROM (VALUES
    ('objeto', 'Tocadiscos Winco seed', 'Funciona perfecto, incluye aguja. Seed demo.', 'Parlantes y libros', 'Centro MdP', 'mitre'),
    ('objeto', 'Esquejes de monstera seed', 'Tres esquejes enraizados. Seed demo.', 'Maceta grande o compost', 'Centro MdP', 'camet'),
    ('servicio', 'Clases de yoga seed', 'Sesión matutina 45 min. Seed demo.', 'Plantas o masajes', 'Chapadmalal', 'chapadmalal'),
    ('objeto', 'Bicicleta playera seed', 'Rodado 26 lista para la costa. Seed demo.', 'Notebook o cámara', 'Miramar', 'miramar'),
    ('objeto', 'Taladro percutor seed', 'Bosch con maletín. Seed demo.', 'Ayuda con mudanza', 'Playa Grande', 'grande'),
    ('servicio', 'Clases de inglés seed', 'Conversación B1+. Seed demo.', 'Clases de guitarra', 'Santa Clara del Mar', 'santa-clara')
  ) AS v(kind, title, description, looking_for, barrio, meeting_point_id)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.posts p
    WHERE p.author_id = seed_id AND p.title = v.title
  );

  -- A couple of own posts for the test user (profile grid)
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = test_id) THEN
    INSERT INTO public.posts (
      author_id, kind, title, description, looking_for, barrio, status, meeting_point_id
    )
    SELECT test_id, v.kind::public.post_kind, v.title, v.description, v.looking_for, v.barrio, 'activa'::public.post_status, v.meeting_point_id
    FROM (VALUES
      ('objeto', 'Caja de herramientas (mía)', 'Juego básico de llaves y destornilladores.', 'Mueble chico o deco', 'Centro MdP', 'mitre'),
      ('servicio', 'Ayuda con mudanza (mía)', 'Disponible fines de semana en la zona.', 'Herramientas o clases', 'Playa Grande', 'grande')
    ) AS v(kind, title, description, looking_for, barrio, meeting_point_id)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.author_id = test_id AND p.title = v.title
    );
  END IF;
END $$;
