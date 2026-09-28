import { crearConfig } from "@/lib/matching/config";
import { crearDisparadorDebounced, recalcularRegion } from "@/lib/matching/jobs";
import { MatchingStore } from "@/lib/matching/repository";
import { createServiceClient } from "@/lib/supabase/admin";

export const MATCH_REGION_ID = "piloto";
const FRESH_MS = 5 * 60_000;

const cfg = crearConfig();

async function runRecalc(regionId: string) {
  const admin = createServiceClient();
  if (!admin) {
    console.warn("[matching] sin SUPABASE_SERVICE_ROLE_KEY; skip recálculo");
    return null;
  }
  const store = new MatchingStore(admin);
  return recalcularRegion(store, regionId, cfg, {
    async notificarInApp(usuarioId, titulo, cuerpo, href) {
      await admin.rpc("notify_user", {
        p_user_id: usuarioId,
        p_type: "match_alta",
        p_title: titulo,
        p_body: cuerpo,
        p_href: href,
      });
    },
  });
}

const dispararDebounced = crearDisparadorDebounced(runRecalc, 60_000);

/** Tras create/update de post: agenda recálculo con debounce 60s. */
export function scheduleMatchRecalc(regionId = MATCH_REGION_ID) {
  dispararDebounced(regionId);
}

/**
 * Al abrir /matches: si la última corrida exitosa tiene > 5 min, recalcula ahora.
 * No-op sin service role.
 */
export async function ensureRegionFresh(regionId = MATCH_REGION_ID) {
  const admin = createServiceClient();
  if (!admin) return { skipped: true as const, reason: "no_service_role" };

  const store = new MatchingStore(admin);
  const ultima = await store.ultimaCorridaTerminada(regionId);
  if (ultima && Date.now() - ultima.terminadaEn.getTime() < FRESH_MS) {
    return { skipped: true as const, reason: "fresh", ultima: ultima.terminadaEn };
  }

  const result = await runRecalc(regionId);
  return { skipped: false as const, result };
}
