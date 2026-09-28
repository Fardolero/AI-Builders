import type {
  ContextoMatching,
  PerfilMatching,
  Publicacion,
  Zona,
} from "@/lib/matching/types";

export const AHORA = new Date("2026-09-23T12:00:00-03:00");
const DIA = 86_400_000;

export const ZONAS: Zona[] = [
  { id: "villa-crespo", nombre: "Villa Crespo", lat: -34.599, lng: -58.438 },
  { id: "palermo", nombre: "Palermo", lat: -34.588, lng: -58.43 },
  { id: "almagro", nombre: "Almagro", lat: -34.61, lng: -58.42 },
  { id: "belgrano", nombre: "Belgrano", lat: -34.562, lng: -58.456 },
  { id: "la-plata", nombre: "La Plata", lat: -34.921, lng: -57.954 },
];

let seq = 0;
export function pub(
  p: Partial<Publicacion> &
    Pick<Publicacion, "usuarioId" | "tipo" | "titulo" | "categoria">,
): Publicacion {
  seq++;
  return {
    id: p.id ?? `pub-${seq}`,
    descripcion: "",
    queBuscaACambio: null,
    zonaId: "villa-crespo",
    estado: "activa",
    creadaEn: new Date(AHORA.getTime() - 2 * DIA),
    actualizadaEn: new Date(AHORA.getTime() - 2 * DIA),
    venceEn: null,
    embedding: null,
    ...p,
  };
}

export function perfil(
  usuarioId: string,
  extra: Partial<PerfilMatching> = {},
): PerfilMatching {
  return {
    usuarioId,
    nombrePublico: `${usuarioId[0]!.toUpperCase()}${usuarioId.slice(1)} X.`,
    zonaId: "villa-crespo",
    cuentaConfirmada: true,
    suspendido: false,
    intercambiosCompletados: 0,
    creditosVecinales: 0,
    categoriasHistorial: [],
    ultimaActividad: new Date(AHORA.getTime() - DIA),
    ...extra,
  };
}

export function ctx(
  perfiles: PerfilMatching[],
  publicaciones: Publicacion[],
  extra: Partial<ContextoMatching> = {},
): ContextoMatching {
  return {
    ahora: AHORA,
    zonas: new Map(ZONAS.map((z) => [z.id, z])),
    perfiles: new Map(perfiles.map((p) => [p.usuarioId, p])),
    publicaciones,
    bloqueos: [],
    descartes: [],
    intercambiosAbiertos: [],
    propuestasAbiertasPorOferta: new Map(),
    ...extra,
  };
}
