// Acceso a datos adaptado al esquema Trocar (profiles, posts, exchanges, user_blocks).
// Usa el cliente Supabase (preferentemente service_role para writes de corrida).

import type { SupabaseClient } from "@supabase/supabase-js";
import type { SugerenciaDTO } from "./index";
import {
  barrioAZonaId,
  categoriaASlug,
  EXCHANGE_OPEN,
  mapPostEstado,
  nombrePublico,
} from "./map";
import type {
  ContextoMatching,
  PerfilMatching,
  Publicacion,
  Sugerencia,
  SugerenciaDemanda,
  Zona,
} from "./types";

export type MatchingClient = SupabaseClient;

export class MatchingStore {
  constructor(private readonly db: MatchingClient) {}

  async cargarContexto(
    regionId: string,
    ahora = new Date(),
  ): Promise<ContextoMatching> {
    const [
      { data: zonasRows, error: zErr },
      { data: profiles, error: pErr },
      { data: posts, error: postsErr },
      { data: blocks, error: bErr },
      { data: descartes, error: dErr },
      { data: exchanges, error: eErr },
    ] = await Promise.all([
      this.db
        .from("zonas")
        .select("id, nombre, lat, lng")
        .eq("region_id", regionId),
      this.db
        .from("profiles")
        .select(
          "id, full_name, barrio, onboarding_completed_at, credits_balance, updated_at, interests",
        ),
      this.db
        .from("posts")
        .select(
          "id, author_id, intent, title, description, looking_for, category, barrio, status, created_at, updated_at",
        )
        .eq("status", "activa"),
      this.db.from("user_blocks").select("blocker_id, blocked_id"),
      this.db
        .from("match_descartes")
        .select("usuario_id, clave, descartado_en, porcentaje_al_descartar")
        .gte(
          "descartado_en",
          new Date(ahora.getTime() - 90 * 86_400_000).toISOString(),
        ),
      this.db
        .from("exchanges")
        .select("post_id, proposer_id, owner_id, status")
        .in("status", [...EXCHANGE_OPEN]),
    ]);

    if (zErr) throw zErr;
    if (pErr) throw pErr;
    if (postsErr) throw postsErr;
    if (bErr) throw bErr;
    if (dErr) throw dErr;
    if (eErr) throw eErr;

    const zonas = new Map<string, Zona>(
      (zonasRows ?? []).map((z) => [
        z.id,
        { id: z.id, nombre: z.nombre, lat: Number(z.lat), lng: Number(z.lng) },
      ]),
    );

    const { data: completedRows } = await this.db
      .from("exchanges")
      .select("proposer_id, owner_id")
      .eq("status", "completed");

    const completados = new Map<string, number>();
    for (const row of completedRows ?? []) {
      completados.set(
        row.proposer_id,
        (completados.get(row.proposer_id) ?? 0) + 1,
      );
      completados.set(row.owner_id, (completados.get(row.owner_id) ?? 0) + 1);
    }

    const catsPorUsuario = new Map<string, Set<string>>();
    for (const post of posts ?? []) {
      const slug = categoriaASlug(post.category);
      const set = catsPorUsuario.get(post.author_id) ?? new Set();
      set.add(slug);
      catsPorUsuario.set(post.author_id, set);
    }

    const perfiles = new Map<string, PerfilMatching>();
    for (const u of profiles ?? []) {
      const zonaId = barrioAZonaId(u.barrio);
      if (!zonas.has(zonaId)) continue;
      perfiles.set(u.id, {
        usuarioId: u.id,
        nombrePublico: nombrePublico(u.full_name),
        zonaId,
        cuentaConfirmada: Boolean(u.onboarding_completed_at),
        suspendido: false,
        intercambiosCompletados: completados.get(u.id) ?? 0,
        creditosVecinales: u.credits_balance ?? 0,
        categoriasHistorial: [...(catsPorUsuario.get(u.id) ?? [])],
        ultimaActividad: new Date(u.updated_at ?? ahora.toISOString()),
      });
    }

    const publicaciones: Publicacion[] = (posts ?? [])
      .filter((p) => perfiles.has(p.author_id))
      .map((p) => ({
        id: p.id,
        usuarioId: p.author_id,
        tipo: p.intent === "busco" ? "busco" : "ofrezco",
        titulo: p.title,
        descripcion: p.description ?? "",
        categoria: categoriaASlug(p.category),
        queBuscaACambio: p.looking_for,
        zonaId: barrioAZonaId(p.barrio),
        estado: mapPostEstado(p.status),
        creadaEn: new Date(p.created_at),
        actualizadaEn: new Date(p.updated_at ?? p.created_at),
        venceEn: null,
        embedding: null,
      }));

    const propuestasAbiertasPorOferta = new Map<string, number>();
    for (const ex of exchanges ?? []) {
      propuestasAbiertasPorOferta.set(
        ex.post_id,
        (propuestasAbiertasPorOferta.get(ex.post_id) ?? 0) + 1,
      );
    }

    return {
      ahora,
      zonas,
      perfiles,
      publicaciones,
      bloqueos: (blocks ?? []).map((b) => [b.blocker_id, b.blocked_id]),
      descartes: (descartes ?? []).map((d) => ({
        usuarioId: d.usuario_id,
        claveSugerencia: d.clave,
        descartadoEn: new Date(d.descartado_en),
        porcentajeAlDescartar: d.porcentaje_al_descartar,
      })),
      intercambiosAbiertos: (exchanges ?? []).map((r) => ({
        publicacionIds: [r.post_id],
        usuarioIds: [r.proposer_id, r.owner_id],
      })),
      propuestasAbiertasPorOferta,
    };
  }

  async abrirCorrida(
    regionId: string,
    version: string,
    config: unknown,
  ): Promise<number> {
    const { data, error } = await this.db
      .from("match_corridas")
      .insert({
        region_id: regionId,
        algo_version: version,
        config,
        iniciada_en: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error || !data) throw error ?? new Error("No se pudo abrir corrida");
    return Number(data.id);
  }

  async cerrarCorrida(
    id: number,
    stats: Record<string, number>,
    errorMsg?: string,
  ): Promise<void> {
    const { error } = await this.db
      .from("match_corridas")
      .update({
        terminada_en: new Date().toISOString(),
        estadisticas: stats,
        error: errorMsg ?? null,
      })
      .eq("id", id);
    if (error) throw error;
  }

  async ultimaCorridaTerminada(
    regionId: string,
  ): Promise<{ id: number; terminadaEn: Date } | null> {
    const { data, error } = await this.db
      .from("match_corridas")
      .select("id, terminada_en")
      .eq("region_id", regionId)
      .not("terminada_en", "is", null)
      .is("error", null)
      .order("terminada_en", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!data?.terminada_en) return null;
    return { id: Number(data.id), terminadaEn: new Date(data.terminada_en) };
  }

  async guardarSugerencias(
    corridaId: number,
    usuarioId: string,
    items: Array<{ s: Sugerencia; dto: SugerenciaDTO }>,
  ): Promise<void> {
    await this.db.from("match_sugerencias").delete().eq("usuario_id", usuarioId);
    if (items.length === 0) return;
    const rows = items.map(({ s, dto }, i) => ({
      usuario_id: usuarioId,
      clave: s.clave,
      corrida_id: corridaId,
      tipo: s.tipo,
      posicion: i + 1,
      porcentaje: s.porcentaje,
      confianza: s.confianza,
      payload: dto,
      aristas: s.aristas.map((a) => ({
        buscoId: a.buscoId,
        ofrezcoId: a.ofrezcoId,
        porcentaje: a.porcentaje,
        desglose: a.desglose,
      })),
    }));
    const { error } = await this.db.from("match_sugerencias").insert(rows);
    if (error) throw error;
  }

  async guardarDemanda(
    corridaId: number,
    usuarioId: string,
    items: SugerenciaDemanda[],
  ): Promise<void> {
    await this.db
      .from("demanda_sugerencias")
      .delete()
      .eq("usuario_id", usuarioId);
    if (items.length === 0) return;
    const rows = items.map((item) => ({
      usuario_id: usuarioId,
      clave: item.clave,
      corrida_id: corridaId,
      etiqueta: item.etiqueta,
      categoria: item.categoria,
      vecinos_buscando: item.vecinosBuscando,
      ofertas_disponibles: item.ofertasDisponibles,
      ambito: item.ambito,
      puntaje: item.puntaje,
      mensaje: item.mensaje,
      deep_link: item.deepLink,
    }));
    const { error } = await this.db.from("demanda_sugerencias").insert(rows);
    if (error) throw error;
  }

  async purgarSnapshotsViejos(
    regionId: string,
    corridaId: number,
  ): Promise<void> {
    const { data: viejas } = await this.db
      .from("match_corridas")
      .select("id")
      .eq("region_id", regionId)
      .neq("id", corridaId);
    const ids = (viejas ?? []).map((r) => r.id);
    if (ids.length === 0) return;
    await this.db.from("match_sugerencias").delete().in("corrida_id", ids);
    await this.db.from("demanda_sugerencias").delete().in("corrida_id", ids);
  }

  /** Idempotente: true si se insertó (aún no notificado). */
  async registrarNotificacionMatch(
    usuarioId: string,
    clave: string,
  ): Promise<boolean> {
    const { data, error } = await this.db
      .from("match_notificaciones")
      .insert({
        usuario_id: usuarioId,
        clave,
        canal: "in_app",
        enviada_en: new Date().toISOString(),
      })
      .select("usuario_id")
      .maybeSingle();
    if (error) {
      if (error.code === "23505") return false;
      throw error;
    }
    return Boolean(data);
  }
}
