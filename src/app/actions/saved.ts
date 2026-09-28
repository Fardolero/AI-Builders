"use server";

import { revalidatePath } from "next/cache";
import { ROUTES } from "@/constants/routes";
import { getCurrentUserAndProfile } from "@/lib/trocar/profile";

export type SavedActionResult = {
  error: string | null;
};

export async function savePostAction(postId: string): Promise<SavedActionResult> {
  const { supabase, user } = await getCurrentUserAndProfile();
  if (!user) {
    return { error: "Tenés que iniciar sesión." };
  }

  const { error } = await supabase.from("saved_posts").upsert(
    { user_id: user.id, post_id: postId },
    { onConflict: "user_id,post_id" },
  );

  if (error) {
    return { error: error.message };
  }

  revalidatePath(ROUTES.saved);
  revalidatePath(ROUTES.feed);
  revalidatePath(ROUTES.post(postId));
  return { error: null };
}

export async function unsavePostAction(postId: string): Promise<SavedActionResult> {
  const { supabase, user } = await getCurrentUserAndProfile();
  if (!user) {
    return { error: "Tenés que iniciar sesión." };
  }

  const { error } = await supabase
    .from("saved_posts")
    .delete()
    .eq("user_id", user.id)
    .eq("post_id", postId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(ROUTES.saved);
  revalidatePath(ROUTES.feed);
  revalidatePath(ROUTES.post(postId));
  return { error: null };
}
