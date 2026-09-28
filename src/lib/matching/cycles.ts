// @ts-nocheck
// Triangulación: ciclos cortos en el grafo usuario->usuario (Top Trading Cycles acotado).
// Arista u->v = "u quiere algo que ofrece v". En un ciclo [u1,u2,...,uk] cada usuario
// recibe de su siguiente y entrega a su anterior: nadie da dos cosas, nadie queda debiendo.

import type { MatchConfig } from './config';
import { claveBloqueo, origenDe } from './engine';
import type { Grafo } from './engine';
import type { AristaInteres, Ciclo, ContextoMatching } from './types';

export function encontrarCiclos(grafo: Grafo, ctx: ContextoMatching, cfg: MatchConfig): Ciclo[] {
  if (!cfg.ciclosHabilitados) return [];

  // Mejor arista por par ordenado (u,v), solo aristas con % suficiente.
  const mejor = new Map<string, AristaInteres>();
  for (const a of grafo.aristas) {
    if (a.porcentaje < cfg.porcentajeMinimoAristaCiclo) continue;
    const k = `${a.deseaUsuarioId}>${a.ofreceUsuarioId}`;
    const prev = mejor.get(k);
    if (!prev || a.rankScore > prev.rankScore) mejor.set(k, a);
  }
  // Lista de adyacencia acotada (top-N salientes por nodo) para limitar la búsqueda.
  const ady = new Map<string, AristaInteres[]>();
  for (const a of mejor.values()) {
    const arr = ady.get(a.deseaUsuarioId) ?? [];
    arr.push(a);
    ady.set(a.deseaUsuarioId, arr);
  }
  for (const [u, arr] of ady) {
    arr.sort((x, y) => y.rankScore - x.rankScore || (x.ofreceUsuarioId < y.ofreceUsuarioId ? -1 : 1));
    ady.set(u, arr.slice(0, cfg.maxAristasSalientesPorNodo));
  }

  const ciclos: Ciclo[] = [];
  const nodos = [...ady.keys()].sort();
  for (const inicio of nodos) {
    // Solo se exploran nodos > inicio: cada ciclo se encuentra una sola vez (rotación canónica).
    const camino: string[] = [inicio];
    const aristasCamino: AristaInteres[] = [];
    const dfs = (u: string) => {
      for (const a of ady.get(u) ?? []) {
        const v = a.ofreceUsuarioId;
        if (v === inicio && camino.length >= 2) {
          const c = armarCiclo([...camino], [...aristasCamino, a], ctx, grafo, cfg);
          if (c) ciclos.push(c);
        } else if (v > inicio && !camino.includes(v) && camino.length < cfg.largoMaximoCiclo) {
          camino.push(v); aristasCamino.push(a);
          dfs(v);
          camino.pop(); aristasCamino.pop();
        }
      }
    };
    dfs(inicio);
  }
  return ciclos;
}

function armarCiclo(usuarios: string[], aristas: AristaInteres[], ctx: ContextoMatching, grafo: Grafo, cfg: MatchConfig): Ciclo | null {
  const k = usuarios.length;
  if (k >= 3) {
    // Umbral de reputación para ciclos largos (filtra, no cambia el %).
    if (usuarios.some((u) => (ctx.perfiles.get(u)?.intercambiosCompletados ?? 0) < cfg.completadosMinimosCiclosLargos)) return null;
    // En un ciclo todos coordinan en un chat grupal: ningún par puede estar bloqueado.
    for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) {
      if (grafo.bloqueados.has(claveBloqueo(usuarios[i], usuarios[j]))) return null;
    }
  }
  const geo = (xs: number[]) => Math.exp(xs.reduce((s, x) => s + Math.log(Math.max(x, 1e-9)), 0) / xs.length);
  const porcentaje = Math.round(100 * geo(aristas.map((a) => a.compat)));
  const rankScore = geo(aristas.map((a) => a.rankScore)) * (cfg.factorLargoCiclo[k] ?? 0.7);
  return {
    clave: `c:${aristas.map((a) => `${a.buscoId}>${a.ofrezcoId}`).join('|')}`,
    usuarios,
    aristas,
    porcentaje,
    rankScore,
  };
}

/**
 * Asignación sin solapamiento (Logica_Triangulacion §5.1, paso 6): cada publicación
 * participa en UN solo ciclo sugerido a la vez. Greedy por rankScore.
 */
export function asignarCiclos(ciclos: Ciclo[]): Ciclo[] {
  const ordenados = [...ciclos].sort((a, b) => b.rankScore - a.rankScore || a.usuarios.length - b.usuarios.length || (a.clave < b.clave ? -1 : 1));
  const usadas = new Set<string>();
  const out: Ciclo[] = [];
  for (const c of ordenados) {
    const pubs = c.aristas.flatMap((a) => [origenDe(a.buscoId), a.ofrezcoId]);
    if (pubs.some((p) => usadas.has(p))) continue;
    pubs.forEach((p) => usadas.add(p));
    out.push(c);
  }
  return out;
}
