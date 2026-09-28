"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { scheduleMatchRecalc } from "@/lib/matching/recalc";
import { getCurrentUserAndProfile } from "@/lib/trocar/profile";
import {
  createPostSchema,
  isProhibitedContent,
  updatePostStatusSchema,
  type CreatePostFormValues,
} from "@/lib/validations/post-trocar";

export type PostActionResult = {
  error: string | null;
  moderated?: boolean;
};

function buildPostPayload(data: CreatePostFormValues) {
  const prohibited = isProhibitedContent(
    data.title,
    data.description,
    data.lookingFor,
    data.category,
  );
  return {
    kind: data.kind,
    intent: data.intent,
    title: data.title,
    description: data.description,
    looking_for: data.lookingFor || "A convenir",
    barrio: data.barrio,
    meeting_point_id: data.meetingPointId ?? null,
    category: data.category,
    condition: data.condition ?? null,
    image_url: data.imageUrl || null,
    status: prohibited ? ("moderado" as const) : ("activa" as const),
  };
}

export async function createPostAction(
  input: CreatePostFormValues,
): Promise<PostActionResult> {
  const parsed = createPostSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Revisá los campos de la publicación." };
  }

  const { supabase, user, profile } = await getCurrentUserAndProfile();
  if (!user || !profile?.onboarding_completed_at) {
    return { error: "Completá el onboarding antes de publicar." };
  }

  const payload = buildPostPayload(parsed.data);

  const { data, error } = await supabase
    .from("posts")
    .insert({
      author_id: user.id,
      ...payload,
    })
    .select("id, status")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "No se pudo crear la publicación." };
  }

  revalidatePath(ROUTES.feed);
  if (data.status === "activa") {
    scheduleMatchRecalc();
  }
  if (data.status === "moderado") {
    return {
      error:
        "No se puede publicar: medicamentos, armas, documentos, animales o servicios regulados. Revisá el contenido.",
      moderated: true,
    };
  }
  redirect(ROUTES.post(data.id));
}

export async function updatePostStatusAction(input: {
  id: string;
  status: "activa" | "pausada" | "intercambiada" | "moderado";
}): Promise<PostActionResult> {
  const parsed = updatePostStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Estado inválido." };
  }

  const { supabase, user } = await getCurrentUserAndProfile();
  if (!user) {
    return { error: "Tenés que iniciar sesión." };
  }

  const { error } = await supabase
    .from("posts")
    .update({
      status: parsed.data.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id)
    .eq("author_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(ROUTES.feed);
  revalidatePath(ROUTES.post(parsed.data.id));
  scheduleMatchRecalc();
  return { error: null };
}

export async function updatePostAction(
  input: CreatePostFormValues & { id: string },
): Promise<PostActionResult> {
  const parsed = createPostSchema.safeParse(input);
  if (!parsed.success || !input.id) {
    return { error: "Revisá los campos de la publicación." };
  }

  const { supabase, user } = await getCurrentUserAndProfile();
  if (!user) {
    return { error: "Tenés que iniciar sesión." };
  }

  const { data: current } = await supabase
    .from("posts")
    .select("id, status")
    .eq("id", input.id)
    .eq("author_id", user.id)
    .maybeSingle();

  if (!current) {
    return { error: "No encontramos tu publicación." };
  }

  if (current.status === "intercambiada") {
    return { error: "Una publicación intercambiada no se edita." };
  }

  const payload = buildPostPayload(parsed.data);

  const { error } = await supabase
    .from("posts")
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id)
    .eq("author_id", user.id);

  if (error) {
    return { error: error.message };
  }

  if (payload.status === "moderado") {
    return {
      error:
        "Quedó en moderación: no se permiten medicamentos, armas, documentos, animales ni servicios regulados.",
      moderated: true,
    };
  }

  revalidatePath(ROUTES.feed);
  revalidatePath(ROUTES.post(input.id));
  if (payload.status === "activa") {
    scheduleMatchRecalc();
  }
  return { error: null };
}
