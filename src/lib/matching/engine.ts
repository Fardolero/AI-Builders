// @ts-nocheck
// Motor de match: construye el grafo de aristas de interés de una región y
// arma el top de sugerencias del dashboard de cada usuario.

import type { MatchConfig } from './config';
import { DistanciasZona } from './geo';
import { similitudCategoria, CATEGORIAS } from './taxonomy';
import { Idf, indexarDeseoVirtual, indexarPublicacion, puntuarArista, SUFIJO_A_CAMBIO } from './score';
import type { DocIndexado, EntornoScoring } from './score';
import type { AristaInteres, Ciclo, Confianza, ContextoMatching, PerfilMatching, Sugerencia } from './types';

export interface Grafo {
  aristas: AristaInteres[];
  porDeseante: Map<string, AristaInteres[]>;
  porOferente: Map<string, AristaInteres[]>;
  deseos: DocIndexado[];
  ofertas: DocIndexado[];
  env: EntornoScoring;
  bloqueados: Set<string>;
  elegibles: Set<string>;
  estadisticas: { comparaciones: number; aristas: number; ms: number };
}

export const claveBloqueo = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
export const origenDe = (publicacionId: string) =>
  publicacionId.endsWith(SUFIJO_A_CAMBIO) ? publicacionId.slice(0, -SUFIJO_A_CAMBIO.length) : publicacionId;

export function usuarioElegible(p: PerfilMatching | undefined): boolean {
  return !!p && p.cuentaConfirmada && !p.suspendido;
}

/**
 * Construye TODAS las aristas de una región. Complejidad: O(D * C) con C = candidatos
 * por deseo (índice invertido por token + categoría), no O(D * O) completo.
 */
export function construirGrafo(ctx: ContextoMatching, cfg: MatchConfig): Grafo {
  const t0 = Date.now();
  const elegibles = new Set([...ctx.perfiles.values()].filter(usuarioElegible).map((p) => p.usuarioId));
  const bloqueados = new Set(ctx.bloqueos.map(([a, b]) => claveBloqueo(a, b)));
  const ahoraMs = ctx.ahora.getTime();

  const activas = ctx.publicaciones.filter(
    (p) => p.estado === 'activa' && elegibles.has(p.usuarioId) && !(p.venceEn && p.venceEn.getTime() <= ahoraMs),
  );

  const idf = new Idf();
  const deseos: DocIndexado[] = [];
  const ofertas: DocIndexado[] = [];
  for (const pub of activas) {
    const doc = indexarPublicacion(pub, cfg);
    idf.agregar(doc);
    if (pub.tipo === 'busco') deseos.push(doc);
    else {
      ofertas.push(doc);
      const virtual = indexarDeseoVirtual(pub, cfg);
      if (virtual) deseos.push(virtual);
    }
  }

  // Índice invertido de ofertas: token -> ofertas, categoría -> ofertas.
  const porToken = new Map<string, number[]>();
  const porCategoria = new Map<string, number[]>();
  ofertas.forEach((o, i) => {
    for (const t of new Set([...o.setTitulo, ...o.setDescripcion])) push(porToken, t, i);
    if (o.categoria) push(porCategoria, o.categoria, i);
  });
  const ofertasConEmbedding = ofertas.map((o, i) => (o.embedding ? i : -1)).filter((i) => i >= 0);

  const env: EntornoScoring = {
    idf,
    distancias: new DistanciasZona(ctx.zonas),
    ahora: ctx.ahora,
    propuestasAbiertasPorOferta: ctx.propuestasAbiertasPorOferta,
    cfg,
  };

  const aristas: AristaInteres[] = [];
  let comparaciones = 0;
  for (const d of deseos) {
    const candidatos = new Set<number>();
    for (const t of d.terminos) for (const i of porToken.get(t.token) ?? []) candidatos.add(i);
    if (d.categoria) {
      for (const [cat, idxs] of porCategoria) {
        if (similitudCategoria(d.categoria, cat) > 0) for (const i of idxs) candidatos.add(i);
      }
    }
    // En v1 (piloto) se comparan todas las ofertas con embedding; con pgvector esto
    // se reemplaza por un top-N por ANN (ver ADR, fase de escala).
    if (d.embedding) for (const i of ofertasConEmbedding) candidatos.add(i);

    for (const i of candidatos) {
      const o = ofertas[i];
      if (o.usuarioId === d.usuarioId || bloqueados.has(claveBloqueo(o.usuarioId, d.usuarioId))) continue;
      comparaciones++;
      const a = puntuarArista(d, o, env);
      if (a) aristas.push(a);
    }
  }

  const porDeseante = new Map<string, AristaInteres[]>();
  const porOferente = new Map<string, AristaInteres[]>();
  for (const a of aristas) {
    push(porDeseante, a.deseaUsuarioId, a);
    push(porOferente, a.ofreceUsuarioId, a);
  }
  return {
    aristas, porDeseante, porOferente, deseos, ofertas, env, bloqueados, elegibles,
    estadisticas: { comparaciones, aristas: aristas.length, ms: Date.now() - t0 },
  };
}

export function confianzaDe(porcentaje: number, cfg: MatchConfig): Confianza {
  if (porcentaje >= cfg.porcentajeAlta) return 'alta';
  if (porcentaje >= cfg.porcentajeMedia) return 'media';
  return 'baja';
}

const claveArista = (a: AristaInteres) => `${a.buscoId}>${a.ofrezcoId}`;
const mejorPorRank = (xs: AristaInteres[]) =>
  xs.reduce((m, x) => (x.rankScore > m.rankScore || (x.rankScore === m.rankScore && claveArista(x) < claveArista(m)) ? x : m));

/**
 * Top-K de sugerencias para el dashboard de `usuarioId`.
 * `ciclosAsignados` viene de `asignarCiclos` (solo se muestran los de largo >= 3; los de
 * largo 2 ya aparecen como "match_mutuo").
 */
export function sugerenciasDashboard(
  usuarioId: string,
  grafo: Grafo,
  ctx: ContextoMatching,
  cfg: MatchConfig,
  ciclosAsignados: Ciclo[] = [],
): Sugerencia[] {
  if (!grafo.elegibles.has(usuarioId)) return [];

  // Pares (publicación, contraparte) que ya están en un intercambio abierto: no sugerir de nuevo.
  const enCurso = new Set<string>();
  for (const x of ctx.intercambiosAbiertos) {
    if (!x.usuarioIds.includes(usuarioId)) continue;
    for (const pubId of x.publicacionIds) for (const u of x.usuarioIds) if (u !== usuarioId) enCurso.add(`${pubId}|${u}`);
  }
  const yaEnCurso = (a: AristaInteres) => {
    const otro = a.deseaUsuarioId === usuarioId ? a.ofreceUsuarioId : a.deseaUsuarioId;
    return enCurso.has(`${a.ofrezcoId}|${otro}`) || enCurso.has(`${origenDe(a.buscoId)}|${otro}`);
  };

  const entrantes = (grafo.porDeseante.get(usuarioId) ?? []).filter((a) => !yaEnCurso(a)); // U quiere algo de C
  const salientes = (grafo.porOferente.get(usuarioId) ?? []).filter((a) => !yaEnCurso(a)); // C quiere algo de U

  const porContraparteIn = agrupar(entrantes, (a) => a.ofreceUsuarioId);
  const porContraparteOut = agrupar(salientes, (a) => a.deseaUsuarioId);

  const candidatas: Sugerencia[] = [];
  const usadas = new Set<string>();

  // 1) Match mutuo: U quiere algo de C y C quiere algo de U.
  for (const [c, ins] of porContraparteIn) {
    const outs = porContraparteOut.get(c);
    if (!outs) continue;
    const aIn = mejorPorRank(ins);
    const aOut = mejorPorRank(outs);
    usadas.add(claveArista(aIn)); usadas.add(claveArista(aOut));
    candidatas.push({
      clave: `m:${claveArista(aIn)}|${claveArista(aOut)}`,
      tipo: 'match_mutuo',
      porcentaje: Math.round(100 * Math.sqrt(aIn.compat * aOut.compat)),
      confianza: 'baja',
      rankScore: Math.sqrt(aIn.rankScore * aOut.rankScore) * cfg.bonusReciprocidad,
      contrapartes: [c],
      aristas: [aIn, aOut],
      publicacionesPropias: [origenDe(aIn.buscoId), aOut.ofrezcoId],
    });
  }
  // 2) Ciclos de largo >= 3 que incluyen a U (sus aristas no se repiten como sugerencias sueltas).
  for (const ciclo of ciclosAsignados) {
    if (!ciclo.usuarios.includes(usuarioId) || ciclo.usuarios.length < 3) continue;
    if (ciclo.aristas.some(yaEnCurso)) continue;
    ciclo.aristas.forEach((a) => usadas.add(claveArista(a)));
    const propias = ciclo.aristas
      .filter((a) => a.deseaUsuarioId === usuarioId || a.ofreceUsuarioId === usuarioId)
      .map((a) => (a.deseaUsuarioId === usuarioId ? origenDe(a.buscoId) : a.ofrezcoId));
    candidatas.push({
      clave: ciclo.clave,
      tipo: 'ciclo',
      porcentaje: ciclo.porcentaje,
      confianza: 'baja',
      rankScore: ciclo.rankScore,
      contrapartes: ciclo.usuarios.filter((u) => u !== usuarioId),
      aristas: ciclo.aristas,
      publicacionesPropias: propias,
    });
  }
  // 3) Unidireccionales: cierran con menos probabilidad, bajan en el ranking (no en el %).
  for (const a of entrantes) {
    if (usadas.has(claveArista(a))) continue;
    candidatas.push(simple('tienen_lo_que_buscas', a, a.ofreceUsuarioId, origenDe(a.buscoId), cfg));
  }
  for (const a of salientes) {
    if (usadas.has(claveArista(a))) continue;
    candidatas.push(simple('buscan_lo_que_ofreces', a, a.deseaUsuarioId, a.ofrezcoId, cfg));
  }

  // Filtros: umbral de % y enfriamiento de descartes.
  const descartes = new Map(ctx.descartes.filter((d) => d.usuarioId === usuarioId).map((d) => [d.claveSugerencia, d]));
  const msEnfriamiento = cfg.diasEnfriamientoDescarte * 86_400_000;
  const filtradas = candidatas.filter((s) => {
    if (s.porcentaje < cfg.porcentajeMinimoDashboard) return false;
    const d = descartes.get(s.clave);
    if (!d) return true;
    const enfriando = ctx.ahora.getTime() - d.descartadoEn.getTime() < msEnfriamiento;
    return !enfriando || s.porcentaje >= d.porcentajeAlDescartar + cfg.mejoraParaReaparecer;
  });

  // Orden determinístico. Créditos Vecinales solo DESEMPATAN (orden permitido, §4).
  const creditos = (s: Sugerencia) => Math.max(0, ...s.contrapartes.map((u) => ctx.perfiles.get(u)?.creditosVecinales ?? 0));
  filtradas.sort((a, b) =>
    b.rankScore - a.rankScore || b.porcentaje - a.porcentaje || creditos(b) - creditos(a) || (a.clave < b.clave ? -1 : 1),
  );

  // Diversidad: cupos por contraparte y por publicación propia.
  const cupoContraparte = new Map<string, number>();
  const cupoPropia = new Map<string, number>();
  const out: Sugerencia[] = [];
  for (const s of filtradas) {
    if (out.length >= cfg.topK) break;
    if (s.contrapartes.some((u) => (cupoContraparte.get(u) ?? 0) >= cfg.maxPorContraparte)) continue;
    if (s.publicacionesPropias.some((p) => (cupoPropia.get(p) ?? 0) >= cfg.maxPorPublicacionPropia)) continue;
    for (const u of s.contrapartes) cupoContraparte.set(u, (cupoContraparte.get(u) ?? 0) + 1);
    for (const p of new Set(s.publicacionesPropias)) cupoPropia.set(p, (cupoPropia.get(p) ?? 0) + 1);
    out.push({ ...s, confianza: confianzaDe(s.porcentaje, cfg) });
  }
  return out;
}

function simple(tipo: 'tienen_lo_que_buscas' | 'buscan_lo_que_ofreces', a: AristaInteres, contraparte: string, propia: string, cfg: MatchConfig): Sugerencia {
  return {
    clave: `${tipo === 'tienen_lo_que_buscas' ? 't' : 'b'}:${claveArista(a)}`,
    tipo,
    porcentaje: a.porcentaje,
    confianza: 'baja',
    rankScore: a.rankScore * cfg.factorUnidireccional,
    contrapartes: [contraparte],
    aristas: [a],
    publicacionesPropias: [propia],
  };
}

/** Matches de UNA publicación (pantalla "Detalle de publicación" → "Coincidencias"). */
export function matchesDePublicacion(publicacionId: string, grafo: Grafo, cfg: MatchConfig, limite = 10): AristaInteres[] {
  return grafo.aristas
    .filter((a) => origenDe(a.buscoId) === publicacionId || a.ofrezcoId === publicacionId)
    .filter((a) => a.porcentaje >= cfg.porcentajeMinimoDashboard)
    .sort((a, b) => b.rankScore - a.rankScore || b.porcentaje - a.porcentaje || (claveArista(a) < claveArista(b) ? -1 : 1))
    .slice(0, limite);
}

export function nombreCategoria(slug: string | null): string {
  return (slug && CATEGORIAS[slug]?.nombre) || 'Otros';
}

function push<K, V>(m: Map<K, V[]>, k: K, v: V): void {
  const arr = m.get(k);
  if (arr) arr.push(v); else m.set(k, [v]);
}
function agrupar<T>(xs: T[], key: (x: T) => string): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const x of xs) push(m, key(x), x);
  return m;
}
