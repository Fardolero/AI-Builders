// @ts-nocheck
// Scoring de una arista "busco -> ofrezco".
//
// REGLA CENTRAL (Logica_Triangulacion §4):
//   % de coincidencia = f(relevancia de contenido, categoría)      <- lo que ve el usuario
//   rankScore         = % * proximidad * frescura * congestión     <- solo para ORDENAR
//   Créditos Vecinales: nunca entran en ninguno de los dos; solo desempatan/filtran.

import type { MatchConfig } from './config';
import { DistanciasZona, factorProximidad } from './geo';
import { naturalezaDe, similitudCategoria } from './taxonomy';
import { similitudTrigramas, tokenizar } from './text';
import type { TokenInfo } from './text';
import type { AristaInteres, FuenteRelevancia, Naturaleza, Publicacion } from './types';

const MS_DIA = 86_400_000;
export const SUFIJO_A_CAMBIO = '#a-cambio';

export interface TerminoPonderado {
  token: string;
  superficie: string;
  peso: number;
  numerico: boolean;
}

/** Publicación pre-procesada una sola vez por corrida. */
export interface DocIndexado {
  id: string;                    // id de publicación, o `${ofertaId}#a-cambio` si es virtual
  origenId: string;              // publicación real de donde sale el texto
  virtual: boolean;
  usuarioId: string;
  zonaId: string;
  categoria: string | null;      // null en "qué busca a cambio" (texto libre)
  naturaleza: Naturaleza | null;
  terminos: TerminoPonderado[];  // vista "como deseo"
  terminoPrincipal: TerminoPonderado | null;
  setTitulo: Set<string>;        // vista "como oferta"
  setDescripcion: Set<string>;
  embedding: number[] | null;
  pub: Publicacion;
}

function ponderar(tokensTitulo: TokenInfo[], tokensDesc: TokenInfo[], cfg: MatchConfig): TerminoPonderado[] {
  const porToken = new Map<string, TerminoPonderado>();
  const agregar = (t: TokenInfo, peso: number) => {
    const previo = porToken.get(t.token);
    if (!previo || previo.peso < peso) porToken.set(t.token, { token: t.token, superficie: t.superficie, peso, numerico: t.numerico });
  };
  let principalAsignado = false;
  for (const t of tokensTitulo) {
    if (t.numerico) { agregar(t, cfg.pesoNumero); continue; }
    agregar(t, principalAsignado ? 1 : cfg.pesoTerminoPrincipal);
    principalAsignado = true;
  }
  for (const t of tokensDesc) agregar(t, t.numerico ? cfg.pesoNumero * cfg.pesoTerminoDescripcion : cfg.pesoTerminoDescripcion);
  return [...porToken.values()];
}

export function indexarPublicacion(pub: Publicacion, cfg: MatchConfig): DocIndexado {
  const tokTitulo = tokenizar(pub.titulo);
  const tokDesc = tokenizar(pub.descripcion);
  const setTitulo = new Set(tokTitulo.map((t) => t.token));
  const terminos = ponderar(tokTitulo, tokDesc, cfg);
  return {
    id: pub.id,
    origenId: pub.id,
    virtual: false,
    usuarioId: pub.usuarioId,
    zonaId: pub.zonaId,
    categoria: pub.categoria,
    naturaleza: naturalezaDe(pub.categoria),
    terminos,
    terminoPrincipal: terminos.find((t) => t.peso === cfg.pesoTerminoPrincipal && !t.numerico) ?? terminos[0] ?? null,
    setTitulo,
    setDescripcion: new Set(tokDesc.map((t) => t.token).filter((t) => !setTitulo.has(t))),
    embedding: pub.embedding && pub.embedding.length > 0 ? pub.embedding : null,
    pub,
  };
}

/** El campo "qué busca a cambio" de una oferta se trata como un deseo virtual de su dueño. */
export function indexarDeseoVirtual(oferta: Publicacion, cfg: MatchConfig): DocIndexado | null {
  const texto = (oferta.queBuscaACambio ?? '').trim();
  if (oferta.tipo !== 'ofrezco' || texto.length === 0) return null;
  const tokens = tokenizar(texto);
  if (tokens.length === 0) return null;
  const terminos = ponderar(tokens, [], cfg);
  return {
    id: oferta.id + SUFIJO_A_CAMBIO,
    origenId: oferta.id,
    virtual: true,
    usuarioId: oferta.usuarioId,
    zonaId: oferta.zonaId,
    categoria: null,
    naturaleza: null,
    terminos,
    terminoPrincipal: terminos.find((t) => !t.numerico) ?? null,
    setTitulo: new Set(tokens.map((t) => t.token)),
    setDescripcion: new Set(),
    embedding: null, // se podría embeber aparte; en v1 el texto libre corto va solo por léxico
    pub: oferta,
  };
}

/** IDF sobre el corpus de la región: términos raros pesan más que los comunes. */
export class Idf {
  private df = new Map<string, number>();
  private n = 0;
  agregar(doc: DocIndexado): void {
    this.n++;
    const vistos = new Set<string>([...doc.setTitulo, ...doc.setDescripcion]);
    for (const t of vistos) this.df.set(t, (this.df.get(t) ?? 0) + 1);
  }
  valor(token: string): number {
    return 1 + Math.log((this.n + 1) / ((this.df.get(token) ?? 0) + 1));
  }
}

export interface RelevanciaLexica {
  valor: number;
  terminos: string[];
}

/** Cobertura ponderada (peso * idf) de los términos del deseo por el texto de la oferta. */
export function relevanciaLexica(deseo: DocIndexado, oferta: DocIndexado, idf: Idf, cfg: MatchConfig): RelevanciaLexica {
  let num = 0;
  let den = 0;
  const terminos: string[] = [];
  for (const t of deseo.terminos) {
    const w = t.peso * idf.valor(t.token);
    den += w;
    let mejor = 0;
    if (oferta.setTitulo.has(t.token)) mejor = 1;
    else if (oferta.setDescripcion.has(t.token)) mejor = cfg.factorCoincidenciaEnDescripcion;
    else if (!t.numerico && t.token.length >= 4) {
      mejor = Math.max(
        mejorTypo(t.token, oferta.setTitulo, cfg),
        mejorTypo(t.token, oferta.setDescripcion, cfg) * cfg.factorCoincidenciaEnDescripcion,
      );
    }
    if (mejor > 0) terminos.push(t.superficie);
    num += w * mejor;
  }
  return { valor: den === 0 ? 0 : num / den, terminos };
}

function mejorTypo(token: string, candidatos: Set<string>, cfg: MatchConfig): number {
  let mejor = 0;
  for (const c of candidatos) {
    if (c.length < 4 || Math.abs(c.length - token.length) > 2) continue;
    const s = similitudTrigramas(token, c);
    if (s >= cfg.umbralTrigramas) {
      const v = cfg.valorTypoMinimo + (1 - cfg.valorTypoMinimo) * (s - cfg.umbralTrigramas) / (1 - cfg.umbralTrigramas);
      mejor = Math.max(mejor, Math.min(v, 0.95)); // un typo nunca vale lo mismo que la palabra exacta
    }
  }
  return mejor;
}

export function coseno(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return na === 0 || nb === 0 ? 0 : dot / Math.sqrt(na * nb);
}

export interface CompatContenido {
  compat: number;
  relevancia: number;
  fuente: FuenteRelevancia;
  terminos: string[];
  categoria: number;
  naturalezaCruzada: boolean;
}

/** Compatibilidad de CONTENIDO (lo que se muestra como %). Sin geografía ni reputación. */
export function compatContenido(deseo: DocIndexado, oferta: DocIndexado, idf: Idf, cfg: MatchConfig): CompatContenido {
  const lex = relevanciaLexica(deseo, oferta, idf, cfg);
  let relevancia = lex.valor;
  let fuente: FuenteRelevancia = 'lexica';
  if (deseo.embedding && oferta.embedding) {
    const { peso, cosenoPiso, cosenoTecho } = cfg.semantica;
    const sem = clamp01((coseno(deseo.embedding, oferta.embedding) - cosenoPiso) / (cosenoTecho - cosenoPiso));
    const hibrida = peso * sem + (1 - peso) * lex.valor;
    // Los embeddings pueden sumar (sinónimos no cargados), nunca hundir un match léxico claro.
    if (hibrida > lex.valor) { relevancia = hibrida; fuente = lex.valor > 0 ? 'hibrida' : 'semantica'; }
  }
  const categoria = deseo.categoria === null || oferta.categoria === null
    ? cfg.categoriaDesconocida
    : similitudCategoria(deseo.categoria, oferta.categoria);
  const naturalezaCruzada = deseo.naturaleza !== null && oferta.naturaleza !== null && deseo.naturaleza !== oferta.naturaleza;
  const compat = clamp01(
    relevancia * (1 - cfg.pesoCategoria + cfg.pesoCategoria * categoria) * (naturalezaCruzada ? cfg.penalizacionNaturaleza : 1),
  );
  return { compat, relevancia, fuente, terminos: lex.terminos, categoria, naturalezaCruzada };
}

export function factorFrescura(pub: Publicacion, ahora: Date, cfg: MatchConfig): number | null {
  if (pub.venceEn && pub.venceEn.getTime() <= ahora.getTime()) return null;
  const dias = Math.max(0, (ahora.getTime() - pub.actualizadaEn.getTime()) / MS_DIA);
  if (dias <= cfg.frescuraPlenaDias) return 1;
  if (dias >= cfg.frescuraPisoDias) return cfg.frescuraPiso;
  const t = (dias - cfg.frescuraPlenaDias) / (cfg.frescuraPisoDias - cfg.frescuraPlenaDias);
  return 1 - t * (1 - cfg.frescuraPiso);
}

export interface EntornoScoring {
  idf: Idf;
  distancias: DistanciasZona;
  ahora: Date;
  propuestasAbiertasPorOferta: Map<string, number>;
  cfg: MatchConfig;
}

/** Arista completa o null si no califica (mismo dueño, poca relevancia, fuera de radio, vencida). */
export function puntuarArista(deseo: DocIndexado, oferta: DocIndexado, env: EntornoScoring): AristaInteres | null {
  const { cfg } = env;
  if (deseo.usuarioId === oferta.usuarioId) return null;
  const c = compatContenido(deseo, oferta, env.idf, cfg);
  if (c.relevancia < cfg.relevanciaMinima) return null;

  const distanciaKm = env.distancias.km(deseo.zonaId, oferta.zonaId);
  const proximidad = factorProximidad(distanciaKm, cfg);
  if (proximidad === null) return null;
  const fD = factorFrescura(deseo.pub, env.ahora, cfg);
  const fO = factorFrescura(oferta.pub, env.ahora, cfg);
  if (fD === null || fO === null) return null;
  const frescura = Math.min(fD, fO);
  const congestion = (env.propuestasAbiertasPorOferta.get(oferta.id) ?? 0) >= cfg.propuestasParaCongestion ? cfg.factorCongestion : 1;

  return {
    buscoId: deseo.id,
    buscoVirtual: deseo.virtual,
    ofrezcoId: oferta.id,
    deseaUsuarioId: deseo.usuarioId,
    ofreceUsuarioId: oferta.usuarioId,
    compat: c.compat,
    porcentaje: Math.round(c.compat * 100),
    rankScore: c.compat * proximidad * frescura * congestion,
    desglose: {
      relevancia: c.relevancia,
      fuenteRelevancia: c.fuente,
      terminosCoincidentes: c.terminos,
      categoria: c.categoria,
      naturalezaCruzada: c.naturalezaCruzada,
      proximidad,
      distanciaKm,
      frescura,
      congestion,
    },
  };
}

export function clamp01(x: number): number {
  return Number.isFinite(x) ? Math.min(1, Math.max(0, x)) : 0;
}
