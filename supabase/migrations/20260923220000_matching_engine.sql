-- Trocar matching engine: zonas + snapshot tables + RLS

CREATE TABLE IF NOT EXISTS public.zonas (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  region_id TEXT NOT NULL DEFAULT 'piloto'
);

CREATE INDEX IF NOT EXISTS zonas_region_idx ON public.zonas (region_id);

INSERT INTO public.zonas (id, nombre, lat, lng, region_id) VALUES
  ('centro-mdp', 'Centro MdP', -38.0055, -57.5426, 'piloto'),
  ('playa-grande', 'Playa Grande', -38.091, -57.547, 'piloto'),
  ('chapadmalal', 'Chapadmalal', -38.167, -57.65, 'piloto'),
  ('santa-clara', 'Santa Clara del Mar', -37.837, -57.507, 'piloto'),
  ('miramar', 'Miramar', -38.2706, -57.8394, 'piloto')
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  region_id = EXCLUDED.region_id;

CREATE TABLE IF NOT EXISTS public.match_corridas (
  id            BIGSERIAL PRIMARY KEY,
  region_id     TEXT        NOT NULL,
  algo_version  TEXT        NOT NULL,
  config        JSONB       NOT NULL,
  iniciada_en   TIMESTAMPTZ NOT NULL DEFAULT now(),
  terminada_en  TIMESTAMPTZ,
  estadisticas  JSONB,
  error         TEXT
);

CREATE TABLE IF NOT EXISTS public.match_sugerencias (
  usuario_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  clave       TEXT        NOT NULL,
  corrida_id  BIGINT      NOT NULL REFERENCES public.match_corridas(id) ON DELETE CASCADE,
  tipo        TEXT        NOT NULL CHECK (tipo IN ('tienen_lo_que_buscas','buscan_lo_que_ofreces','match_mutuo','ciclo')),
  posicion    SMALLINT    NOT NULL CHECK (posicion > 0),
  porcentaje  SMALLINT    NOT NULL CHECK (porcentaje BETWEEN 0 AND 100),
  confianza   TEXT        NOT NULL CHECK (confianza IN ('alta','media','baja')),
  payload     JSONB       NOT NULL,
  aristas     JSONB       NOT NULL,
  creada_en   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (usuario_id, clave)
);
CREATE INDEX IF NOT EXISTS match_sugerencias_orden_idx ON public.match_sugerencias (usuario_id, posicion);
CREATE INDEX IF NOT EXISTS match_sugerencias_aristas_idx ON public.match_sugerencias USING gin (aristas jsonb_path_ops);

CREATE TABLE IF NOT EXISTS public.match_descartes (
  usuario_id               UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  clave                    TEXT        NOT NULL,
  descartado_en            TIMESTAMPTZ NOT NULL DEFAULT now(),
  porcentaje_al_descartar  SMALLINT    NOT NULL CHECK (porcentaje_al_descartar BETWEEN 0 AND 100),
  PRIMARY KEY (usuario_id, clave)
);

CREATE TABLE IF NOT EXISTS public.match_notificaciones (
  usuario_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  clave       TEXT        NOT NULL,
  canal       TEXT        NOT NULL CHECK (canal IN ('push','digest','in_app')),
  enviada_en  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (usuario_id, clave, canal)
);

CREATE TABLE IF NOT EXISTS public.demanda_sugerencias (
  usuario_id          UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  clave               TEXT        NOT NULL,
  corrida_id          BIGINT      NOT NULL REFERENCES public.match_corridas(id) ON DELETE CASCADE,
  etiqueta            TEXT        NOT NULL,
  categoria           TEXT        NOT NULL,
  vecinos_buscando    INT         NOT NULL CHECK (vecinos_buscando >= 3),
  ofertas_disponibles INT         NOT NULL CHECK (ofertas_disponibles >= 0),
  ambito              TEXT        NOT NULL CHECK (ambito IN ('tu_barrio','cerca')),
  puntaje             FLOAT8      NOT NULL,
  mensaje             TEXT        NOT NULL,
  deep_link           TEXT        NOT NULL,
  creada_en           TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (usuario_id, clave)
);

CREATE TABLE IF NOT EXISTS public.demanda_push_log (
  usuario_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  clave       TEXT        NOT NULL,
  dia         DATE        NOT NULL DEFAULT CURRENT_DATE,
  enviada_en  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (usuario_id, clave, dia)
);
CREATE INDEX IF NOT EXISTS demanda_push_log_usuario_idx ON public.demanda_push_log (usuario_id, enviada_en DESC);

ALTER TABLE public.zonas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_corridas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_sugerencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_descartes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demanda_sugerencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demanda_push_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "zonas son publicas" ON public.zonas;
CREATE POLICY "zonas son publicas"
  ON public.zonas FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "ver mis sugerencias" ON public.match_sugerencias;
CREATE POLICY "ver mis sugerencias"
  ON public.match_sugerencias FOR SELECT TO authenticated
  USING (usuario_id = auth.uid());

DROP POLICY IF EXISTS "ver mis sugerencias de demanda" ON public.demanda_sugerencias;
CREATE POLICY "ver mis sugerencias de demanda"
  ON public.demanda_sugerencias FOR SELECT TO authenticated
  USING (usuario_id = auth.uid());

DROP POLICY IF EXISTS "ver mis descartes" ON public.match_descartes;
CREATE POLICY "ver mis descartes"
  ON public.match_descartes FOR SELECT TO authenticated
  USING (usuario_id = auth.uid());

DROP POLICY IF EXISTS "crear mis descartes" ON public.match_descartes;
CREATE POLICY "crear mis descartes"
  ON public.match_descartes FOR INSERT TO authenticated
  WITH CHECK (usuario_id = auth.uid());

DROP POLICY IF EXISTS "borrar mis descartes via api" ON public.match_descartes;
CREATE POLICY "borrar mis sugerencias al descartar"
  ON public.match_sugerencias FOR DELETE TO authenticated
  USING (usuario_id = auth.uid());

GRANT SELECT ON public.zonas TO anon, authenticated;
GRANT SELECT ON public.match_sugerencias, public.demanda_sugerencias, public.match_descartes TO authenticated;
GRANT INSERT ON public.match_descartes TO authenticated;
GRANT DELETE ON public.match_sugerencias TO authenticated;
