"use server";

import { revalidatePath } from "next/cache";
import { ROUTES } from "@/constants/routes";
import { getCurrentUserAndProfile } from "@/lib/trocar/profile";

export type ModerationActionResult = {
  error: string | null;
  ok?: boolean;
};

export async function reportUserOrPostAction(input: {
  reason: string;
  targetUserId?: string;
  targetPostId?: string;
}): Promise<ModerationActionResult> {
  const reason = input.reason.trim();
  if (reason.length < 5) {
    return { error: "Contá el motivo (mínimo 5 caracteres)." };
  }
  if (!input.targetUserId && !input.targetPostId) {
    return { error: "No hay objetivo para reportar." };
  }

  const { supabase, user } = await getCurrentUserAndProfile();
  if (!user) {
    return { error: "Tenés que iniciar sesión." };
  }

  if (input.targetUserId && input.targetUserId === user.id) {
    return { error: "No podés reportarte a vos mismo." };
  }

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    target_user_id: input.targetUserId ?? null,
    target_post_id: input.targetPostId ?? null,
    reason,
  });

  if (error) {
    return { error: error.message };
  }

  return { error: null, ok: true };
}

export async function blockUserAction(
  blockedId: string,
): Promise<ModerationActionResult> {
  const { supabase, user } = await getCurrentUserAndProfile();
  if (!user) {
    return { error: "Tenés que iniciar sesión." };
  }
  if (blockedId === user.id) {
    return { error: "No podés bloquearte a vos mismo." };
  }

  const { error } = await supabase.from("user_blocks").upsert(
    {
      blocker_id: user.id,
      blocked_id: blockedId,
    },
    { onConflict: "blocker_id,blocked_id" },
  );

  if (error) {
    return { error: error.message };
  }

  revalidatePath(ROUTES.feed);
  revalidatePath(ROUTES.profilePublic(blockedId));
  return { error: null, ok: true };
}
