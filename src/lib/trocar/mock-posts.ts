import type { PostCardData } from "@/components/trocar/post-card";
import { MEETING_POINTS, PILOT_BARRIOS } from "@/constants/routes";

export type MockPost = PostCardData & {
  authorName: string;
  authorBio?: string;
  authorId?: string;
  meetingPointId?: (typeof MEETING_POINTS)[number]["id"];
};

export const MOCK_FEATURED_NEIGHBORS = [
  {
    id: "mock-neighbor-martina",
    full_name: "Martina R.",
    barrio: "Centro MdP",
    credits_balance: 42,
  },
  {
    id: "mock-neighbor-julian",
    full_name: "Julián P.",
    barrio: "Chapadmalal",
    credits_balance: 28,
  },
  {
    id: "mock-neighbor-sofia",
    full_name: "Sofía M.",
    barrio: "Playa Grande",
    credits_balance: 35,
  },
  {
    id: "mock-neighbor-nico",
    full_name: "Nico G.",
    barrio: "Santa Clara del Mar",
    credits_balance: 22,
  },
  {
    id: "mock-neighbor-ana",
    full_name: "Ana L.",
    barrio: "Miramar",
    credits_balance: 19,
  },
  {
    id: "mock-neighbor-valen",
    full_name: "Valen S.",
    barrio: "Centro MdP",
    credits_balance: 31,
  },
] as const;

export const MOCK_POSTS: MockPost[] = [
  {
    id: "mock-tocadiscos",
    kind: "objeto",
    title: "Tocadiscos Winco",
    description:
      "Funciona perfecto, incluye aguja de repuesto. Lo uso poco y ocupa espacio en casa.",
    looking_for: "Parlantes y libros",
    barrio: "Centro MdP",
    status: "activa",
    created_at: "2026-09-18T12:00:00.000Z",
    authorName: "Martina R.",
    authorBio: "Colecciono vinilos y plantas.",
    authorId: "mock-neighbor-martina",
    meetingPointId: "mitre",
  },
  {
    id: "mock-libros",
    kind: "objeto",
    title: "Libros de Historia",
    description:
      "Caja con 12 libros de historia argentina y universal, en buen estado.",
    looking_for: "Cualquier cosa de ciencia ficción",
    barrio: "Chapadmalal",
    status: "activa",
    created_at: "2026-09-19T15:30:00.000Z",
    authorName: "Julián P.",
    authorId: "mock-neighbor-julian",
    meetingPointId: "chapadmalal",
  },
  {
    id: "mock-taladro",
    kind: "objeto",
    title: "Taladro percutor",
    description:
      "Taladro Bosch con maletín y mechas. Ideal para trabajos ocasionales en casa.",
    looking_for: "Ayuda con mudanza o escalera",
    barrio: "Playa Grande",
    status: "activa",
    created_at: "2026-09-20T09:00:00.000Z",
    authorName: "Sofía M.",
    authorId: "mock-neighbor-sofia",
    meetingPointId: "grande",
  },
  {
    id: "mock-guitarra",
    kind: "servicio",
    title: "Clases de guitarra",
    description:
      "Dos horas semanales de clases para principiantes. Puedo ir a tu casa en la zona.",
    looking_for: "Clases de inglés o edición de video",
    barrio: "Santa Clara del Mar",
    status: "activa",
    created_at: "2026-09-20T18:00:00.000Z",
    authorName: "Nico G.",
    authorBio: "Músico y vecino de Santa Clara.",
    authorId: "mock-neighbor-nico",
    meetingPointId: "santa-clara",
  },
  {
    id: "mock-bicicleta",
    kind: "objeto",
    title: "Bicicleta playera",
    description:
      "Rodado 26, frenos a V, lista para usar. Perfecta para moverse cerca de la costa.",
    looking_for: "Cámara o notebook en desuso",
    barrio: "Miramar",
    status: "activa",
    created_at: "2026-09-21T11:20:00.000Z",
    authorName: "Ana L.",
    authorId: "mock-neighbor-ana",
    meetingPointId: "miramar",
  },
  {
    id: "mock-plantas",
    kind: "objeto",
    title: "Esquejes de monstera",
    description:
      "Tres esquejes enraizados de monstera deliciosa. Incluyo tip de cuidado.",
    looking_for: "Maceta grande o compost",
    barrio: "Centro MdP",
    status: "activa",
    created_at: "2026-09-21T16:45:00.000Z",
    authorName: "Valen S.",
    authorId: "mock-neighbor-valen",
    meetingPointId: "camet",
  },
  {
    id: "mock-lampara",
    kind: "objeto",
    title: "Lámpara de pie deco",
    description:
      "Lámpara nórdica con pantalla de lino. Ideal para living o escritorio.",
    looking_for: "Espejo o cuadro",
    barrio: "Centro MdP",
    status: "activa",
    created_at: "2026-09-22T10:00:00.000Z",
    authorName: "Martina R.",
    authorId: "mock-neighbor-martina",
    meetingPointId: "mitre",
  },
  {
    id: "mock-yoga",
    kind: "servicio",
    title: "Clase de yoga matutina",
    description:
      "Sesión de 45 minutos en plaza o en casa. Nivel inicial/intermedio.",
    looking_for: "Masajes o plantas",
    barrio: "Chapadmalal",
    status: "activa",
    created_at: "2026-09-22T12:30:00.000Z",
    authorName: "Julián P.",
    authorId: "mock-neighbor-julian",
    meetingPointId: "chapadmalal",
  },
  {
    id: "mock-notebook",
    kind: "objeto",
    title: "Notebook para estudiar",
    description:
      "Lenovo i5, 8GB RAM. Sirve para facu y ofimática. Incluye cargador.",
    looking_for: "Bicicleta o ayuda de mudanza",
    barrio: "Playa Grande",
    status: "activa",
    created_at: "2026-09-22T14:00:00.000Z",
    authorName: "Sofía M.",
    authorId: "mock-neighbor-sofia",
    meetingPointId: "grande",
  },
  {
    id: "mock-caja-herramientas",
    kind: "objeto",
    title: "Caja de herramientas",
    description:
      "Juego de llaves, destornilladores y nivel. Perfecta para el hogar.",
    looking_for: "Mueble chico o deco",
    barrio: "Santa Clara del Mar",
    status: "activa",
    created_at: "2026-09-22T16:20:00.000Z",
    authorName: "Nico G.",
    authorId: "mock-neighbor-nico",
    meetingPointId: "santa-clara",
  },
  {
    id: "mock-ingles",
    kind: "servicio",
    title: "Clases de inglés conversación",
    description:
      "Práctica oral una hora semanal. Nivel B1+. Online o presencial.",
    looking_for: "Clases de guitarra o yoga",
    barrio: "Miramar",
    status: "activa",
    created_at: "2026-09-22T18:00:00.000Z",
    authorName: "Ana L.",
    authorId: "mock-neighbor-ana",
    meetingPointId: "miramar",
  },
  {
    id: "mock-sillon",
    kind: "objeto",
    title: "Sillón de un cuerpo",
    description:
      "Sillón tapizado verde, muy cómodo. Lo cambio porque renové el living.",
    looking_for: "Estantería o mesa ratona",
    barrio: "Centro MdP",
    status: "activa",
    created_at: "2026-09-22T19:30:00.000Z",
    authorName: "Valen S.",
    authorId: "mock-neighbor-valen",
    meetingPointId: "camet",
  },
];

export function getMockPost(id: string): MockPost | undefined {
  return MOCK_POSTS.find((post) => post.id === id);
}

export function isMockPostId(id: string): boolean {
  return id.startsWith("mock-");
}

export function mockPostHref(id: string) {
  return `/posts/demo/${id}` as const;
}

export function toFeedMockPosts() {
  return MOCK_POSTS.map((post) => ({
    id: post.id,
    kind: post.kind,
    title: post.title,
    description: post.description,
    looking_for: post.looking_for,
    barrio: post.barrio,
    status: post.status,
    created_at: post.created_at,
    meetingPointId: post.meetingPointId ?? null,
    author: { full_name: post.authorName },
  }));
}

export function barrioPinCounts(posts: { barrio: string }[]) {
  const counts = Object.fromEntries(
    PILOT_BARRIOS.map((barrio) => [barrio, 0]),
  ) as Record<(typeof PILOT_BARRIOS)[number], number>;

  for (const post of posts) {
    if (post.barrio in counts) {
      counts[post.barrio as (typeof PILOT_BARRIOS)[number]] += 1;
    }
  }
  return counts;
}

export function meetingPointCounts(
  posts: { meetingPointId?: string | null }[],
) {
  const counts: Record<string, number> = {};
  for (const point of MEETING_POINTS) {
    counts[point.id] = 0;
  }
  for (const post of posts) {
    if (post.meetingPointId && post.meetingPointId in counts) {
      counts[post.meetingPointId] = (counts[post.meetingPointId] ?? 0) + 1;
    }
  }
  return counts;
}
