// Handlers de API: leen snapshots. usuarioId SIEMPRE de sesión autenticada.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { SugerenciaDTO } from "./index";

export class ErrorApi extends Error {
  status: number;
  constructor(status: number, mensaje: string) {
    super(mensaje);
    this.status = status;
  }
}

export interface DashboardDTO {
  matches: SugerenciaDTO[];
  demanda: Array<{
    clave: string;
    mensaje: string;
    etiqueta: string;
    categoria: string;
    vecinosBuscando: number;
    deepLink: string;
  }>;
  demandaPrimero: boolean;
  actualizadoEn: string | null;
}

/** GET /api/matches/dashboard */
export async function getDashboard(
  db: SupabaseClient,
  usuarioId: string,
): Promise<DashboardDTO> {
  const [
    { data: matches },
    { data: demanda },
    { count: completados },
    { data: blocksAsBlocker },
    { data: blocksAsBlocked },
  ] = await Promise.all([
    db
      .from("match_sugerencias")
      .select("payload, creada_en")
      .eq("usuario_id", usuarioId)
      .order("posicion", { ascending: true })
      .limit(20),
    db
      .from("demanda_sugerencias")
      .select(
        "clave, mensaje, etiqueta, categoria, vecinos_buscando, deep_link",
      )
      .eq("usuario_id", usuarioId)
      .order("puntaje", { ascending: false })
      .limit(3),
    db
      .from("exchanges")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed")
      .or(`proposer_id.eq.${usuarioId},owner_id.eq.${usuarioId}`),
    db
      .from("user_blocks")
      .select("blocked_id")
      .eq("blocker_id", usuarioId),
    db
      .from("user_blocks")
      .select("blocker_id")
      .eq("blocked_id", usuarioId),
  ]);

  const bloqueados = new Set<string>([
    ...(blocksAsBlocker ?? []).map((b) => b.blocked_id as string),
    ...(blocksAsBlocked ?? []).map((b) => b.blocker_id as string),
  ]);

  const visible = (s: SugerenciaDTO) =>
    !s.intercambios.some(
      (i) =>
        bloqueados.has(i.entrega.usuarioId) || bloqueados.has(i.recibe.usuarioId),
    );

  const matchRows = matches ?? [];
  return {
    matches: matchRows
      .map((r) => r.payload as SugerenciaDTO)
      .filter(visible),
    demanda: (demanda ?? []).map((r) => ({
      clave: r.clave,
      mensaje: r.mensaje,
      etiqueta: r.etiqueta,
      categoria: r.categoria,
      vecinosBuscando: r.vecinos_buscando,
      deepLink: r.deep_link,
    })),
    demandaPrimero: (completados ?? 0) === 0,
    actualizadoEn: matchRows[0]
      ? new Date(matchRows[0].creada_en as string).toISOString()
      : null,
  };
}

/** POST /api/matches/:clave/descartar */
export async function postDescartar(
  db: SupabaseClient,
  usuarioId: string,
  clave: string,
): Promise<void> {
  if (typeof clave !== "string" || clave.length === 0 || clave.length > 500) {
    throw new ErrorApi(400, "Clave inválida");
  }

  const { data: deleted, error } = await db
    .from("match_sugerencias")
    .delete()
    .eq("usuario_id", usuarioId)
    .eq("clave", clave)
    .select("porcentaje")
    .maybeSingle();

  if (error) throw error;
  if (!deleted) throw new ErrorApi(404, "Sugerencia no encontrada");

  const { error: insertErr } = await db.from("match_descartes").upsert(
    {
      usuario_id: usuarioId,
      clave,
      descartado_en: new Date().toISOString(),
      porcentaje_al_descartar: deleted.porcentaje,
    },
    { onConflict: "usuario_id,clave" },
  );
  if (insertErr) throw insertErr;
}
