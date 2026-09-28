"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { getCurrentUserAndProfile } from "@/lib/trocar/profile";
import {
  counterOfferSchema,
  exchangeMessageSchema,
  proposeExchangeSchema,
  ratingSchema,
  type ProposeExchangeValues,
  type RatingFormValues,
} from "@/lib/validations/exchange";

export type ExchangeActionResult = {
  error: string | null;
};

async function notify(
  supabase: Awaited<ReturnType<typeof getCurrentUserAndProfile>>["supabase"],
  userId: string,
  type: string,
  title: string,
  body: string,
  href?: string,
) {
  await supabase.rpc("notify_user", {
    p_user_id: userId,
    p_type: type,
    p_title: title,
    p_body: body,
    p_href: href ?? null,
  });
}

export async function proposeExchangeAction(
  input: ProposeExchangeValues,
): Promise<ExchangeActionResult> {
  const parsed = proposeExchangeSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Revisá tu oferta." };
  }

  const { supabase, user, profile } = await getCurrentUserAndProfile();
  if (!user || !profile?.onboarding_completed_at) {
    return { error: "Tenés que completar el onboarding." };
  }

  const { data: post } = await supabase
    .from("posts")
    .select("id, author_id, title, status")
    .eq("id", parsed.data.postId)
    .maybeSingle();

  if (!post || post.status !== "activa") {
    return { error: "La publicación no está disponible." };
  }

  if (post.author_id === user.id) {
    return { error: "No podés proponer sobre tu propia publicación." };
  }

  const { count: ownPostsCount } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("author_id", user.id)
    .eq("status", "activa");

  if (!ownPostsCount || ownPostsCount < 1) {
    return {
      error:
        "Publicá algo tuyo primero para proponer un intercambio. Andá a Publicar.",
    };
  }

  let offerText = parsed.data.offerText;
  if (parsed.data.offerPostId) {
    const { data: offerPost } = await supabase
      .from("posts")
      .select("id, title, looking_for, author_id, status")
      .eq("id", parsed.data.offerPostId)
      .eq("author_id", user.id)
      .maybeSingle();
    if (!offerPost || offerPost.status !== "activa") {
      return { error: "Elegí una de tus publicaciones activas." };
    }
    offerText = `Ofrezco: ${offerPost.title}${
      offerPost.looking_for ? ` (busca: ${offerPost.looking_for})` : ""
    }. ${parsed.data.offerText}`.trim();
  }

  const { data: existing } = await supabase
    .from("exchanges")
    .select("id, status")
    .eq("post_id", post.id)
    .eq("proposer_id", user.id)
    .in("status", ["pending", "countered", "accepted", "coordinating"])
    .maybeSingle();

  if (existing) {
    redirect(ROUTES.exchange(existing.id));
  }

  const { data: exchange, error } = await supabase
    .from("exchanges")
    .insert({
      post_id: post.id,
      proposer_id: user.id,
      owner_id: post.author_id,
      status: "pending",
      offer_text: offerText,
    })
    .select("id")
    .single();

  if (error || !exchange) {
    return { error: error?.message ?? "No se pudo crear la propuesta." };
  }

  await supabase.from("exchange_messages").insert({
    exchange_id: exchange.id,
    sender_id: user.id,
    body: `Propuesta: ${offerText}`,
  });

  await notify(
    supabase,
    post.author_id,
    "proposal",
    "Nueva propuesta de intercambio",
    `Recibiste una propuesta por “${post.title}”.`,
    ROUTES.exchange(exchange.id),
  );

  revalidatePath(ROUTES.exchanges);
  redirect(ROUTES.exchange(exchange.id));
}

export async function sendExchangeMessageAction(input: {
  exchangeId: string;
  body: string;
}): Promise<ExchangeActionResult> {
  const parsed = exchangeMessageSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Mensaje inválido." };
  }

  const { supabase, user } = await getCurrentUserAndProfile();
  if (!user) {
    return { error: "Tenés que iniciar sesión." };
  }

  const { data: exchange } = await supabase
    .from("exchanges")
    .select("id, proposer_id, owner_id, status")
    .eq("id", parsed.data.exchangeId)
    .maybeSingle();

  if (!exchange) {
    return { error: "Intercambio no encontrado." };
  }

  if (user.id !== exchange.proposer_id && user.id !== exchange.owner_id) {
    return { error: "No participás de este intercambio." };
  }

  const { error } = await supabase.from("exchange_messages").insert({
    exchange_id: exchange.id,
    sender_id: user.id,
    body: parsed.data.body,
  });

  if (error) {
    return { error: error.message };
  }

  const recipient =
    user.id === exchange.proposer_id ? exchange.owner_id : exchange.proposer_id;

  await notify(
    supabase,
    recipient,
    "message",
    "Nuevo mensaje",
    parsed.data.body.slice(0, 120),
    ROUTES.exchange(exchange.id),
  );

  revalidatePath(ROUTES.exchange(exchange.id));
  return { error: null };
}

export async function acceptExchangeAction(
  exchangeId: string,
): Promise<ExchangeActionResult> {
  const { supabase, user } = await getCurrentUserAndProfile();
  if (!user) {
    return { error: "Tenés que iniciar sesión." };
  }

  const { data: exchange } = await supabase
    .from("exchanges")
    .select("id, owner_id, proposer_id, status, post_id")
    .eq("id", exchangeId)
    .maybeSingle();

  if (!exchange) {
    return { error: "Intercambio no encontrado." };
  }

  const canOwnerAccept =
    exchange.owner_id === user.id &&
    (exchange.status === "pending" || exchange.status === "countered");
  const canProposerAcceptCounter =
    exchange.proposer_id === user.id && exchange.status === "countered";

  if (!canOwnerAccept && !canProposerAcceptCounter) {
    return { error: "No podés aceptar esta propuesta ahora." };
  }

  const { error } = await supabase
    .from("exchanges")
    .update({
      status: "coordinating",
      updated_at: new Date().toISOString(),
    })
    .eq("id", exchangeId);

  if (error) {
    return { error: error.message };
  }

  await supabase.from("exchange_messages").insert({
    exchange_id: exchangeId,
    sender_id: user.id,
    body: "Propuesta aceptada. Coordinemos el encuentro.",
  });

  await notify(
    supabase,
    canOwnerAccept ? exchange.proposer_id : exchange.owner_id,
    "accepted",
    "Propuesta aceptada",
    "Ya pueden coordinar el intercambio.",
    ROUTES.exchange(exchangeId),
  );

  revalidatePath(ROUTES.exchange(exchangeId));
  return { error: null };
}

export async function rejectExchangeAction(
  exchangeId: string,
): Promise<ExchangeActionResult> {
  const { supabase, user } = await getCurrentUserAndProfile();
  if (!user) {
    return { error: "Tenés que iniciar sesión." };
  }

  const { data: exchange } = await supabase
    .from("exchanges")
    .select("id, owner_id, proposer_id, status, post_id")
    .eq("id", exchangeId)
    .maybeSingle();

  if (!exchange || exchange.owner_id !== user.id) {
    return { error: "Solo el dueño puede rechazar." };
  }

  const { error } = await supabase
    .from("exchanges")
    .update({
      status: "rejected",
      updated_at: new Date().toISOString(),
    })
    .eq("id", exchangeId);

  if (error) {
    return { error: error.message };
  }

  await notify(
    supabase,
    exchange.proposer_id,
    "rejected",
    "Propuesta rechazada",
    "El vecino rechazó tu propuesta.",
    ROUTES.post(exchange.post_id),
  );

  revalidatePath(ROUTES.exchange(exchangeId));
  return { error: null };
}

export async function counterExchangeAction(input: {
  exchangeId: string;
  counterText: string;
}): Promise<ExchangeActionResult> {
  const parsed = counterOfferSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Revisá la contraoferta." };
  }

  const { supabase, user } = await getCurrentUserAndProfile();
  if (!user) {
    return { error: "Tenés que iniciar sesión." };
  }

  const { data: exchange } = await supabase
    .from("exchanges")
    .select("id, owner_id, proposer_id, status")
    .eq("id", parsed.data.exchangeId)
    .maybeSingle();

  if (!exchange || exchange.owner_id !== user.id) {
    return { error: "Solo el dueño puede contraofertar." };
  }

  const { error } = await supabase
    .from("exchanges")
    .update({
      status: "countered",
      counter_text: parsed.data.counterText,
      updated_at: new Date().toISOString(),
    })
    .eq("id", exchange.id);

  if (error) {
    return { error: error.message };
  }

  await supabase.from("exchange_messages").insert({
    exchange_id: exchange.id,
    sender_id: user.id,
    body: `Contraoferta: ${parsed.data.counterText}`,
  });

  await notify(
    supabase,
    exchange.proposer_id,
    "counter",
    "Recibiste una contraoferta",
    parsed.data.counterText.slice(0, 120),
    ROUTES.exchange(exchange.id),
  );

  revalidatePath(ROUTES.exchange(exchange.id));
  return { error: null };
}

export async function reviseOfferAction(input: {
  exchangeId: string;
  offerText: string;
}): Promise<ExchangeActionResult> {
  const parsed = counterOfferSchema.safeParse({
    exchangeId: input.exchangeId,
    counterText: input.offerText,
  });
  if (!parsed.success) {
    return { error: "Revisá la propuesta." };
  }

  const { supabase, user } = await getCurrentUserAndProfile();
  if (!user) {
    return { error: "Tenés que iniciar sesión." };
  }

  const { data: exchange } = await supabase
    .from("exchanges")
    .select("id, proposer_id, owner_id, status")
    .eq("id", parsed.data.exchangeId)
    .maybeSingle();

  if (!exchange || exchange.proposer_id !== user.id || exchange.status !== "countered") {
    return { error: "Solo podés ajustar una propuesta con contraoferta." };
  }

  const { error } = await supabase
    .from("exchanges")
    .update({
      status: "pending",
      offer_text: parsed.data.counterText,
      counter_text: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", exchange.id);

  if (error) {
    return { error: error.message };
  }

  await supabase.from("exchange_messages").insert({
    exchange_id: exchange.id,
    sender_id: user.id,
    body: `Ajusté la propuesta: ${parsed.data.counterText}`,
  });

  await notify(
    supabase,
    exchange.owner_id,
    "proposal",
    "Propuesta ajustada",
    parsed.data.counterText.slice(0, 120),
    ROUTES.exchange(exchange.id),
  );

  revalidatePath(ROUTES.exchange(exchange.id));
  return { error: null };
}

export async function confirmExchangeAction(
  exchangeId: string,
): Promise<ExchangeActionResult> {
  const { supabase, user } = await getCurrentUserAndProfile();
  if (!user) {
    return { error: "Tenés que iniciar sesión." };
  }

  const { data: exchange } = await supabase
    .from("exchanges")
    .select("*")
    .eq("id", exchangeId)
    .maybeSingle();

  if (!exchange) {
    return { error: "Intercambio no encontrado." };
  }

  if (exchange.status !== "coordinating" && exchange.status !== "accepted") {
    return { error: "Todavía no se puede confirmar." };
  }

  const isProposer = user.id === exchange.proposer_id;
  const isOwner = user.id === exchange.owner_id;
  if (!isProposer && !isOwner) {
    return { error: "No participás de este intercambio." };
  }

  const nextProposerConfirmed = isProposer
    ? new Date().toISOString()
    : exchange.proposer_confirmed_at;
  const nextOwnerConfirmed = isOwner
    ? new Date().toISOString()
    : exchange.owner_confirmed_at;
  const bothConfirmed = Boolean(nextProposerConfirmed) && Boolean(nextOwnerConfirmed);

  const { error } = await supabase
    .from("exchanges")
    .update({
      updated_at: new Date().toISOString(),
      status: bothConfirmed ? "completed" : "coordinating",
      proposer_confirmed_at: nextProposerConfirmed,
      owner_confirmed_at: nextOwnerConfirmed,
    })
    .eq("id", exchangeId);

  if (error) {
    return { error: error.message };
  }

  if (bothConfirmed) {
    await supabase.rpc("award_exchange_credits", {
      p_exchange_id: exchangeId,
    });

    await supabase
      .from("posts")
      .update({
        status: "intercambiada",
        updated_at: new Date().toISOString(),
      })
      .eq("id", exchange.post_id);

    await notify(
      supabase,
      exchange.proposer_id,
      "completed",
      "Trueque concretado",
      "Sumaste +10 Créditos Vecinales. Calificá al vecino.",
      ROUTES.exchangeRate(exchangeId),
    );
    await notify(
      supabase,
      exchange.owner_id,
      "completed",
      "Trueque concretado",
      "Sumaste +10 Créditos Vecinales. Calificá al vecino.",
      ROUTES.exchangeRate(exchangeId),
    );

    revalidatePath(ROUTES.exchange(exchangeId));
    redirect(ROUTES.exchangeRate(exchangeId));
  }

  const other = isProposer ? exchange.owner_id : exchange.proposer_id;
  await notify(
    supabase,
    other,
    "confirm",
    "Confirmación recibida",
    "Tu contraparte marcó el trueque como concretado.",
    ROUTES.exchange(exchangeId),
  );

  revalidatePath(ROUTES.exchange(exchangeId));
  return { error: null };
}

export async function cancelExchangeAction(
  exchangeId: string,
): Promise<ExchangeActionResult> {
  const { supabase, user } = await getCurrentUserAndProfile();
  if (!user) {
    return { error: "Tenés que iniciar sesión." };
  }

  const { data: exchange } = await supabase
    .from("exchanges")
    .select("id, owner_id, proposer_id, status")
    .eq("id", exchangeId)
    .maybeSingle();

  if (!exchange) {
    return { error: "Intercambio no encontrado." };
  }

  if (exchange.owner_id !== user.id && exchange.proposer_id !== user.id) {
    return { error: "No participás de este intercambio." };
  }

  if (
    exchange.status === "completed" ||
    exchange.status === "cancelled" ||
    exchange.status === "rejected"
  ) {
    return { error: "Este intercambio ya no se puede cancelar." };
  }

  const { error } = await supabase
    .from("exchanges")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", exchangeId);

  if (error) {
    return { error: error.message };
  }

  await supabase.from("exchange_messages").insert({
    exchange_id: exchangeId,
    sender_id: user.id,
    body: "Intercambio cancelado.",
  });

  const other =
    exchange.owner_id === user.id ? exchange.proposer_id : exchange.owner_id;
  await notify(
    supabase,
    other,
    "cancelled",
    "Intercambio cancelado",
    "La otra parte canceló el trueque.",
    ROUTES.exchange(exchangeId),
  );

  revalidatePath(ROUTES.exchange(exchangeId));
  revalidatePath(ROUTES.exchanges);
  return { error: null };
}

export async function submitRatingAction(
  input: RatingFormValues,
): Promise<ExchangeActionResult> {
  const parsed = ratingSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Revisá la calificación." };
  }

  const { supabase, user } = await getCurrentUserAndProfile();
  if (!user) {
    return { error: "Tenés que iniciar sesión." };
  }

  const { data: exchange } = await supabase
    .from("exchanges")
    .select("id, status, proposer_id, owner_id")
    .eq("id", parsed.data.exchangeId)
    .maybeSingle();

  if (!exchange || exchange.status !== "completed") {
    return { error: "Solo se califica un trueque concretado." };
  }

  const toUserId =
    user.id === exchange.proposer_id
      ? exchange.owner_id
      : user.id === exchange.owner_id
        ? exchange.proposer_id
        : null;

  if (!toUserId) {
    return { error: "No participás de este intercambio." };
  }

  const { error } = await supabase.from("ratings").upsert(
    {
      exchange_id: exchange.id,
      from_user_id: user.id,
      to_user_id: toUserId,
      stars: parsed.data.stars,
      comment: parsed.data.comment?.trim() || null,
    },
    { onConflict: "exchange_id,from_user_id" },
  );

  if (error) {
    return { error: error.message };
  }

  await notify(
    supabase,
    toUserId,
    "rating",
    "Nueva calificación",
    `Te calificaron con ${parsed.data.stars} estrellas.`,
    ROUTES.profilePublic(user.id),
  );

  revalidatePath(ROUTES.profile);
  revalidatePath(ROUTES.profilePublic(toUserId));
  redirect(ROUTES.profile);
}

export async function markNotificationReadAction(
  notificationId: string,
): Promise<ExchangeActionResult> {
  const { supabase, user } = await getCurrentUserAndProfile();
  if (!user) {
    return { error: "Tenés que iniciar sesión." };
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(ROUTES.notifications);
  revalidatePath(ROUTES.feed);
  return { error: null };
}
