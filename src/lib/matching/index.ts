// @ts-nocheck
// Fachada del módulo: una corrida por región + presentación segura para la API.

import { ALGO_VERSION } from './config';
import type { MatchConfig } from './config';
import { asignarCiclos, encontrarCiclos } from './cycles';
import { sugerenciasDemanda } from './demand';
import { construirGrafo, origenDe, sugerenciasDashboard } from './engine';
import type { Grafo } from './engine';
import { distanciaVisible } from './geo';
import { CATEGORIAS } from './taxonomy';
import type { Ciclo, ContextoMatching, Publicacion, Sugerencia, SugerenciaDemanda } from './types';

export interface ResultadoRegion {
  version: string;
  calculadoEn: Date;
  grafo: Grafo;
  ciclosAsignados: Ciclo[];
  demanda: Map<string, SugerenciaDemanda[]>;
  dashboard: (usuarioId: string) => Sugerencia[];
}

export function calcularRegion(ctx: ContextoMatching, cfg: MatchConfig): ResultadoRegion {
  const grafo = construirGrafo(ctx, cfg);
  const ciclosAsignados = asignarCiclos(encontrarCiclos(grafo, ctx, cfg));
  const demanda = sugerenciasDemanda(grafo, ctx, cfg);
  return {
    version: ALGO_VERSION,
    calculadoEn: ctx.ahora,
    grafo,
    ciclosAsignados,
    demanda,
    dashboard: (u) => sugerenciasDashboard(u, grafo, ctx, cfg, ciclosAsignados),
  };
}

// ---------- DTOs (lo ÚNICO que sale por la API) ----------

export interface ItemIntercambioDTO {
  entrega: { usuarioId: string; nombre: string };
  recibe: { usuarioId: string; nombre: string };
  publicacion: { id: string; titulo: string; categoria: string };
  porcentaje: number;
}

export interface SugerenciaDTO {
  clave: string;
  tipo: Sugerencia['tipo'];
  porcentaje: number;
  confianza: Sugerencia['confianza'];
  titular: string;
  motivos: string[];            // chips: "Coincide: guitarra", "Misma categoría", "a menos de 1 km"
  distancia: string;            // redondeada, nunca exacta
  intercambios: ItemIntercambioDTO[];
  accion: { etiqueta: string; href: string };
}

/**
 * Convierte una sugerencia interna en DTO. No expone: embeddings, rankScore,
 * Créditos de terceros, zonas ajenas ni ids de usuarios bloqueados.
 */
export function presentarSugerencias(ss: Sugerencia[], usuarioId: string, ctx: ContextoMatching): SugerenciaDTO[] {
  const pubs = new Map(ctx.publicaciones.map((p) => [p.id, p])); // índice una sola vez por request
  return ss.map((s) => presentarSugerencia(s, usuarioId, ctx, pubs));
}

export function presentarSugerencia(
  s: Sugerencia,
  usuarioId: string,
  ctx: ContextoMatching,
  pubs: Map<string, Publicacion> = new Map(ctx.publicaciones.map((p) => [p.id, p])),
): SugerenciaDTO {
  const nombre = (u: string) => ctx.perfiles.get(u)?.nombrePublico ?? 'Vecino';
  const principal = s.aristas.find((a) => a.deseaUsuarioId === usuarioId) ?? s.aristas[0];
  const maxDist = Math.max(...s.aristas.map((a) => a.desglose.distanciaKm));

  const motivos: string[] = [];
  const terminos = [...new Set(s.aristas.flatMap((a) => a.desglose.terminosCoincidentes))].slice(0, 3);
  if (terminos.length) motivos.push(`Coincide: ${terminos.join(', ')}`);
  if (principal.desglose.categoria === 1) motivos.push('Misma categoría');
  if (s.tipo === 'match_mutuo') motivos.push('Interés mutuo');
  motivos.push(distanciaVisible(maxDist));

  const intercambios: ItemIntercambioDTO[] = s.aristas.map((a) => {
    const p = pubs.get(a.ofrezcoId);
    return {
      entrega: { usuarioId: a.ofreceUsuarioId, nombre: nombre(a.ofreceUsuarioId) },
      recibe: { usuarioId: a.deseaUsuarioId, nombre: nombre(a.deseaUsuarioId) },
      publicacion: { id: a.ofrezcoId, titulo: p?.titulo ?? '', categoria: CATEGORIAS[p?.categoria ?? '']?.nombre ?? 'Otros' },
      porcentaje: a.porcentaje,
    };
  });

  const otro = nombre(s.contrapartes[0]);
  const tituloDe = (id: string) => pubs.get(origenDe(id))?.titulo ?? '';
  const titular =
    s.tipo === 'tienen_lo_que_buscas' ? `${otro} tiene algo que buscás: ${tituloDe(principal.ofrezcoId)}`
    : s.tipo === 'buscan_lo_que_ofreces' ? `${otro} busca algo que ofrecés: ${tituloDe(principal.ofrezcoId)}`
    : s.tipo === 'match_mutuo' ? `Trueque directo con ${otro}`
    : `Trueque en cadena con ${s.contrapartes.length} vecinos`;

  const targetPubId =
    s.tipo === "buscan_lo_que_ofreces"
      ? origenDe(principal.buscoId)
      : principal.ofrezcoId;
  const href =
    s.tipo === "ciclo"
      ? `/matches?ciclo=${encodeURIComponent(s.clave)}`
      : `/posts/${encodeURIComponent(targetPubId)}/propose`;

  return {
    clave: s.clave,
    tipo: s.tipo,
    porcentaje: s.porcentaje,
    confianza: s.confianza,
    titular,
    motivos,
    distancia: distanciaVisible(maxDist),
    intercambios,
    accion: {
      etiqueta: s.tipo === "ciclo" ? "Ver propuesta en cadena" : "Proponer trueque",
      href,
    },
  };
}

export { construirGrafo, sugerenciasDashboard } from './engine';
export { encontrarCiclos, asignarCiclos } from './cycles';
export { sugerenciasDemanda, planificarPushDemanda } from './demand';
export { CONFIG_DEFAULT, crearConfig, ALGO_VERSION } from './config';
