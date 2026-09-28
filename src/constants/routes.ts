export const APP_NAME = "Trocar";

export const ROUTES = {
  home: "/",
  login: "/login",
  loginVerify: "/login/verificar",
  register: "/register",
  onboarding: "/onboarding",
  feed: "/feed",
  postsNew: "/posts/new",
  post: (id: string) => `/posts/${id}` as const,
  postPropose: (id: string) => `/posts/${id}/propose` as const,
  exchanges: "/exchanges",
  exchange: (id: string) => `/exchanges/${id}` as const,
  exchangeRate: (id: string) => `/exchanges/${id}/rate` as const,
  profile: "/profile",
  profilePublic: (id: string) => `/u/${id}` as const,
  notifications: "/notifications",
  saved: "/guardados",
  matches: "/matches",
  dashboard: "/dashboard",
  authCallback: "/auth/callback",
  terms: "/terminos",
  api: {
    health: "/api/health",
    posts: "/api/posts",
    auth: "/api/auth",
  },
} as const;

export const PILOT_BARRIOS = [
  "Centro MdP",
  "Playa Grande",
  "Chapadmalal",
  "Santa Clara del Mar",
  "Miramar",
] as const;

export type PilotBarrio = (typeof PILOT_BARRIOS)[number];

export const INTEREST_OPTIONS = [
  "Plantas",
  "Libros",
  "Clases",
  "Herramientas",
  "Tecnología",
  "Deco",
  "Deportes",
  "Hogar",
] as const;

export type InterestOption = (typeof INTEREST_OPTIONS)[number];

export const CATEGORY_FILTERS = [
  {
    id: "hogar",
    label: "Hogar",
    icon: "home",
    keywords: ["hogar", "mueble", "lámpara", "lampara", "sillón", "sillon", "mesa", "deco"],
  },
  {
    id: "deportes",
    label: "Deportes",
    icon: "bike",
    keywords: ["bici", "bicicleta", "deporte", "yoga", "playera"],
  },
  {
    id: "herramientas",
    label: "Herramientas",
    icon: "wrench",
    keywords: ["taladro", "herramienta", "llave", "caja", "mecha"],
  },
  {
    id: "libros",
    label: "Libros",
    icon: "book",
    keywords: ["libro", "libros", "lectura", "ciencia ficción", "historia"],
  },
  {
    id: "plantas",
    label: "Plantas",
    icon: "leaf",
    keywords: ["planta", "plantas", "esqueje", "monstera", "maceta", "compost"],
  },
  {
    id: "tecnologia",
    label: "Tecnología",
    icon: "laptop",
    keywords: ["notebook", "cámara", "camara", "parlante", "tecnología", "tecnologia"],
  },
  {
    id: "clases",
    label: "Clases",
    icon: "graduation",
    keywords: ["clase", "clases", "guitarra", "inglés", "ingles", "yoga"],
  },
] as const;

/** Puntos de encuentro simulados entre Mar del Plata y Miramar (coords reales aprox.). */
export const MEETING_POINTS = [
  {
    id: "mitre",
    label: "Plaza Mitre",
    barrio: "Centro MdP",
    lat: -38.0055,
    lng: -57.5426,
  },
  {
    id: "grande",
    label: "Playa Grande",
    barrio: "Playa Grande",
    lat: -38.091,
    lng: -57.547,
  },
  {
    id: "camet",
    label: "Parque Camet",
    barrio: "Centro MdP",
    lat: -37.924,
    lng: -57.507,
  },
  {
    id: "chapadmalal",
    label: "Chapadmalal",
    barrio: "Chapadmalal",
    lat: -38.167,
    lng: -57.65,
  },
  {
    id: "santa-clara",
    label: "Santa Clara del Mar",
    barrio: "Santa Clara del Mar",
    lat: -37.837,
    lng: -57.507,
  },
  {
    id: "miramar",
    label: "Plaza Central Miramar",
    barrio: "Miramar",
    lat: -38.2706,
    lng: -57.8394,
  },
] as const;

export type MeetingPointId = (typeof MEETING_POINTS)[number]["id"];
