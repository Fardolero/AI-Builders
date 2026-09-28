// Jobs: recálculo por región + notificaciones in-app de match alta confianza.

import type { MatchConfig } from "./config";
import { planificarPushDemanda } from "./demand";
import { calcularRegion, presentarSugerencias } from "./index";
import { MatchingStore } from "./repository";

export type NotificarInApp = (
  usuarioId: string,
  titulo: string,
  cuerpo: string,
  href: string,
) => Promise<void>;

/**
 * Recalcula TODA la región y reemplaza los snapshots de sugerencias.
 */
export async function recalcularRegion(
  store: MatchingStore,
  regionId: string,
  cfg: MatchConfig,
  opciones: { notificarInApp?: NotificarInApp } = {},
): Promise<{
  corridaId: number;
  usuarios: number;
  aristas: number;
  ciclos: number;
  ms: number;
}> {
  const t0 = Date.now();
  const ctx = await store.cargarContexto(regionId);
  const resultado = calcularRegion(ctx, cfg);
  const corridaId = await store.abrirCorrida(regionId, resultado.version, cfg);
  try {
    let usuarios = 0;
    for (const usuarioId of resultado.grafo.elegibles) {
      const sugerencias = resultado.dashboard(usuarioId);
      const dtos = presentarSugerencias(sugerencias, usuarioId, ctx);
      await store.guardarSugerencias(
        corridaId,
        usuarioId,
        sugerencias.map((s, i) => ({ s, dto: dtos[i]! })),
      );
      await store.guardarDemanda(
        corridaId,
        usuarioId,
        resultado.demanda.get(usuarioId) ?? [],
      );
      usuarios++;

      const alta = sugerencias.find((s) => s.confianza === "alta");
      if (alta && opciones.notificarInApp) {
        const nueva = await store.registrarNotificacionMatch(
          usuarioId,
          alta.clave,
        );
        if (nueva) {
          const dto = dtos[sugerencias.indexOf(alta)]!;
          await opciones.notificarInApp(
            usuarioId,
            `Match del ${alta.porcentaje}%`,
            dto.titular,
            dto.accion.href,
          );
        }
      }
    }
    await store.purgarSnapshotsViejos(regionId, corridaId);
    const stats = {
      usuarios,
      publicaciones: ctx.publicaciones.length,
      aristas: resultado.grafo.estadisticas.aristas,
      comparaciones: resultado.grafo.estadisticas.comparaciones,
      ciclos: resultado.ciclosAsignados.length,
      ms: Date.now() - t0,
    };
    await store.cerrarCorrida(corridaId, stats);
    return {
      corridaId,
      usuarios,
      aristas: stats.aristas,
      ciclos: stats.ciclos,
      ms: stats.ms,
    };
  } catch (e) {
    await store.cerrarCorrida(
      corridaId,
      {},
      e instanceof Error ? e.message : String(e),
    );
    throw e;
  }
}

/**
 * Debounce en memoria: agenda UN recálculo por región.
 * En serverless, preferir skip-if-recent (ver ensureRegionFresh).
 */
export function crearDisparadorDebounced(
  recalcular: (regionId: string) => Promise<unknown>,
  ms = 60_000,
) {
  const pendientes = new Map<string, ReturnType<typeof setTimeout>>();
  const enCurso = new Set<string>();
  return (regionId: string) => {
    clearTimeout(pendientes.get(regionId));
    pendientes.set(
      regionId,
      setTimeout(async () => {
        pendientes.delete(regionId);
        if (enCurso.has(regionId)) return;
        enCurso.add(regionId);
        try {
          await recalcular(regionId);
        } catch (e) {
          console.error("[matching] recálculo falló", regionId, e);
        } finally {
          enCurso.delete(regionId);
        }
      }, ms),
    );
  };
}

/** Plan de push de demanda (FCM fuera de alcance; útil para tests / futuro). */
export async function planDemandaRegion(
  store: MatchingStore,
  regionId: string,
  cfg: MatchConfig,
) {
  const ctx = await store.cargarContexto(regionId);
  const r = calcularRegion(ctx, cfg);
  return planificarPushDemanda(
    r.demanda,
    ctx.perfiles,
    new Map(),
    ctx.ahora,
    cfg,
  );
}
