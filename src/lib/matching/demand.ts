// @ts-nocheck
// Demanda zonal: "En tu barrio, N vecinos buscan X. ¿Tenés algo así para ofrecer?"
//
// Objetivo: subir la LIQUIDEZ (más ofertas donde hay demanda insatisfecha) y activar
// a los vecinos que menos trueques cerraron. Reglas de privacidad:
//   - k-anonimato: nunca se muestra una demanda con menos de k vecinos DISTINTOS.
//   - Nunca se muestra quién busca, ni zonas más finas que el barrio.
//   - Solo cuentan publicaciones activas de cuentas confirmadas y no suspendidas.

import type { MatchConfig } from './config';
import type { Grafo } from './engine';
import { nombreCategoria } from './engine';
import { compatContenido } from './score';
import type { DocIndexado } from './score';
import { similitudCategoria } from './taxonomy';
import { etiquetaVisible } from './text';
import type { ContextoMatching, PerfilMatching, SugerenciaDemanda } from './types';

export interface ClusterDemanda {
  clave: string;
  etiqueta: string;
  categoria: string;
  representante: DocIndexado;
  /** Consulta sintética = solo el término que da nombre a la demanda; mide si una oferta la cubre. */
  consulta: DocIndexado;
  miembros: DocIndexado[];
}

/** Agrupa deseos parecidos ("bici rodado 20", "bicicleta para nena") en un mismo cluster. */
export function agruparDemanda(grafo: Grafo, ctx: ContextoMatching, cfg: MatchConfig): ClusterDemanda[] {
  const desde = ctx.ahora.getTime() - cfg.demanda.ventanaDias * 86_400_000;
  const deseos = grafo.deseos
    .filter((d) => !d.virtual && d.pub.creadaEn.getTime() >= desde && d.terminos.length > 0)
    .sort((a, b) => a.pub.creadaEn.getTime() - b.pub.creadaEn.getTime() || (a.id < b.id ? -1 : 1));

  const clusters: Array<{ rep: DocIndexado; miembros: DocIndexado[] }> = [];
  for (const d of deseos) {
    let mejor: { i: number; s: number } | null = null;
    clusters.forEach((c, i) => {
      if (c.rep.naturaleza !== d.naturaleza) return;
      if (similitudCategoria(c.rep.categoria ?? '', d.categoria ?? '') === 0) return;
      // Mismo término principal ("bici ..." / "bicicleta ...") agrupa directo; si no, similitud simétrica.
      const mismoPrincipal = !!d.terminoPrincipal && d.terminoPrincipal.token === c.rep.terminoPrincipal?.token;
      const s = mismoPrincipal ? 1
        : (compatContenido(d, c.rep, grafo.env.idf, cfg).relevancia + compatContenido(c.rep, d, grafo.env.idf, cfg).relevancia) / 2;
      if (s >= cfg.demanda.similitudCluster && (!mejor || s > mejor.s)) mejor = { i, s };
    });
    if (mejor) clusters[(mejor as { i: number }).i].miembros.push(d);
    else clusters.push({ rep: d, miembros: [d] });
  }

  return clusters.map((c) => {
    const conteo = new Map<string, { n: number; superficie: string }>();
    for (const m of c.miembros) {
      const t = m.terminoPrincipal;
      if (!t) continue;
      const prev = conteo.get(t.token);
      conteo.set(t.token, { n: (prev?.n ?? 0) + 1, superficie: prev?.superficie ?? t.superficie });
    }
    const [token, info] = [...conteo.entries()].sort((a, b) => b[1].n - a[1].n || (a[0] < b[0] ? -1 : 1))[0]
      ?? [c.rep.terminos[0].token, { n: 0, superficie: c.rep.terminos[0].superficie }];
    const categorias = moda(c.miembros.map((m) => m.categoria ?? 'otros'));
    const termino = { token, superficie: info.superficie, peso: 1, numerico: false };
    return {
      consulta: { ...c.rep, id: `d:${categorias}:${token}`, virtual: true, categoria: categorias, terminos: [termino], terminoPrincipal: termino },
      clave: `d:${categorias}:${token}`,
      etiqueta: etiquetaVisible(token, info.superficie),
      categoria: categorias,
      representante: c.rep,
      miembros: c.miembros,
    };
  });
}

interface DemandaEnZona {
  cluster: ClusterDemanda;
  solicitantes: Set<string>;
  zonasSolicitantes: string[];
  ofertasQueCubren: number;
  ofertantes: Set<string>;
  puntaje: number;
}

function demandaParaZona(zonaId: string, clusters: ClusterDemanda[], grafo: Grafo, cfg: MatchConfig): DemandaEnZona[] {
  const dist = grafo.env.distancias;
  const out: DemandaEnZona[] = [];
  const ofertasCerca = grafo.ofertas.filter((o) => dist.km(zonaId, o.zonaId) <= cfg.demanda.radioKm);
  for (const cluster of clusters) {
    const miembros = cluster.miembros.filter((m) => dist.km(zonaId, m.zonaId) <= cfg.demanda.radioKm);
    const solicitantes = new Set(miembros.map((m) => m.usuarioId));
    if (solicitantes.size < cfg.demanda.kAnonimato) continue;
    const ofertantes = new Set<string>();
    let cubren = 0;
    for (const o of ofertasCerca) {
      if (solicitantes.has(o.usuarioId)) continue;
      if (compatContenido(cluster.consulta, o, grafo.env.idf, cfg).compat >= cfg.demanda.umbralCobertura) {
        cubren++;
        ofertantes.add(o.usuarioId);
      }
    }
    // Se comparan PERSONAS con PERSONAS: si hay tantos oferentes distintos como buscadores, no es "alta demanda".
    if (solicitantes.size <= ofertantes.size) continue;
    out.push({
      cluster,
      solicitantes,
      zonasSolicitantes: miembros.map((m) => m.zonaId),
      ofertasQueCubren: cubren,
      ofertantes,
      puntaje: solicitantes.size / (1 + ofertantes.size),
    });
  }
  return out;
}

export function prioridadPorHistorial(completados: number, cfg: MatchConfig): number {
  for (const t of cfg.demanda.tramosPrioridad) if (completados <= t.hastaCompletados) return t.peso;
  return cfg.demanda.tramosPrioridad[cfg.demanda.tramosPrioridad.length - 1]?.peso ?? 0.2;
}

/** Sugerencias de "qué publicar" para cada usuario elegible de la región. */
export function sugerenciasDemanda(grafo: Grafo, ctx: ContextoMatching, cfg: MatchConfig): Map<string, SugerenciaDemanda[]> {
  const res = new Map<string, SugerenciaDemanda[]>();
  if (!cfg.demanda.habilitada) return res;
  const clusters = agruparDemanda(grafo, ctx, cfg);
  const porZona = new Map<string, DemandaEnZona[]>();
  const ofertasPorUsuario = new Map<string, DocIndexado[]>();
  for (const o of grafo.ofertas) ofertasPorUsuario.set(o.usuarioId, [...(ofertasPorUsuario.get(o.usuarioId) ?? []), o]);

  for (const usuarioId of grafo.elegibles) {
    const perfil = ctx.perfiles.get(usuarioId)!;
    let demandas = porZona.get(perfil.zonaId);
    if (!demandas) { demandas = demandaParaZona(perfil.zonaId, clusters, grafo, cfg); porZona.set(perfil.zonaId, demandas); }
    if (demandas.length === 0) continue;
    const maxPuntaje = Math.max(...demandas.map((d) => d.puntaje));
    const misOfertas = ofertasPorUsuario.get(usuarioId) ?? [];
    const misCategorias = new Set([...perfil.categoriasHistorial, ...misOfertas.map((o) => o.categoria ?? '')]);
    const prioridadUsuario = prioridadPorHistorial(perfil.intercambiosCompletados, cfg);

    const lista: SugerenciaDemanda[] = [];
    for (const d of demandas) {
      if (d.solicitantes.has(usuarioId)) continue;  // lo busca él: no se le pide que lo ofrezca
      if (d.ofertantes.has(usuarioId)) continue;    // ya lo ofrece: aparece como match, no como demanda
      if (misOfertas.some((o) => compatContenido(d.cluster.consulta, o, grafo.env.idf, cfg).compat >= cfg.demanda.umbralCobertura)) continue;
      const afinidad = afinidadCategoria(d.cluster.categoria, misCategorias, cfg);
      const vecinos = d.solicitantes.size;
      const enMiBarrio = d.zonasSolicitantes.filter((z) => z === perfil.zonaId).length;
      const ambito: 'tu_barrio' | 'cerca' = enMiBarrio * 2 > d.zonasSolicitantes.length ? 'tu_barrio' : 'cerca';
      lista.push({
        clave: `${d.cluster.clave}@${perfil.zonaId}`,
        usuarioId,
        etiqueta: d.cluster.etiqueta,
        categoria: d.cluster.categoria,
        vecinosBuscando: vecinos,
        ofertasDisponibles: d.ofertasQueCubren,
        ambito,
        puntaje: (d.puntaje / maxPuntaje) * afinidad,
        prioridadUsuario,
        mensaje: redactarMensaje(d.cluster.etiqueta, d.cluster.categoria, vecinos, ambito, ctx.zonas.get(perfil.zonaId)?.nombre),
        deepLink: deepLinkPublicar(d.cluster, `${d.cluster.clave}@${perfil.zonaId}`),
      });
    }
    lista.sort((a, b) => b.puntaje - a.puntaje || (a.clave < b.clave ? -1 : 1));
    if (lista.length) res.set(usuarioId, lista.slice(0, cfg.demanda.maxSugerenciasPorUsuario));
  }
  return res;
}

function afinidadCategoria(categoria: string, mias: Set<string>, cfg: MatchConfig): number {
  if (mias.has(categoria)) return cfg.demanda.afinidadMismaCategoria;
  for (const c of mias) if (c && similitudCategoria(c, categoria) > 0) return cfg.demanda.afinidadAdyacente;
  return cfg.demanda.afinidadBase;
}

/** Plantilla determinística. Un LLM puede reescribirla, pero nunca cambiar número ni etiqueta. */
export function redactarMensaje(etiqueta: string, categoria: string, vecinos: number, ambito: 'tu_barrio' | 'cerca', barrio?: string): string {
  const quienes = vecinos >= 10 ? 'más de 10 vecinos' : `${vecinos} vecinos`;
  const donde = ambito === 'tu_barrio' && barrio ? `En ${barrio}` : 'Cerca tuyo';
  return `${donde}, ${quienes} están buscando “${etiqueta}” (${nombreCategoria(categoria)}). ¿Tenés algo así para ofrecer?`;
}

function deepLinkPublicar(c: ClusterDemanda, claveInsight: string): string {
  const q = new URLSearchParams({
    intent: "ofrezco",
    categoria: c.categoria,
    titulo: c.etiqueta,
    origen: "demanda_zonal",
    insight: claveInsight,
  });
  return `/posts/new?${q.toString()}`;
}

export interface EnvioPush { usuarioId: string; sugerencia: SugerenciaDemanda }

/**
 * Plan de notificaciones push de demanda. PRIORIZA a quienes menos trueques cerraron:
 * orden por intercambiosCompletados ascendente, con presupuesto diario por zona y
 * un push como máximo cada `diasEntrePush` por usuario. El resto lo ve solo en el dashboard.
 */
export function planificarPushDemanda(
  sugerencias: Map<string, SugerenciaDemanda[]>,
  perfiles: Map<string, PerfilMatching>,
  ultimoPush: Map<string, Date>,
  ahora: Date,
  cfg: MatchConfig,
): EnvioPush[] {
  const minMs = cfg.demanda.diasEntrePush * 86_400_000;
  const candidatos = [...sugerencias.entries()]
    .map(([u, s]) => ({ perfil: perfiles.get(u)!, s: s[0] }))
    .filter(({ perfil, s }) => perfil && s
      && perfil.intercambiosCompletados <= cfg.demanda.maxCompletadosParaPush
      && ahora.getTime() - (ultimoPush.get(perfil.usuarioId)?.getTime() ?? 0) >= minMs)
    .sort((a, b) =>
      a.perfil.intercambiosCompletados - b.perfil.intercambiosCompletados
      || b.s.puntaje - a.s.puntaje
      || b.perfil.ultimaActividad.getTime() - a.perfil.ultimaActividad.getTime()
      || (a.perfil.usuarioId < b.perfil.usuarioId ? -1 : 1));

  const usadoPorZona = new Map<string, number>();
  const out: EnvioPush[] = [];
  for (const { perfil, s } of candidatos) {
    const n = usadoPorZona.get(perfil.zonaId) ?? 0;
    if (n >= cfg.demanda.presupuestoPushPorZonaPorDia) continue;
    usadoPorZona.set(perfil.zonaId, n + 1);
    out.push({ usuarioId: perfil.usuarioId, sugerencia: s });
  }
  return out;
}

function moda(xs: string[]): string {
  const m = new Map<string, number>();
  for (const x of xs) m.set(x, (m.get(x) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0]?.[0] ?? 'otros';
}
