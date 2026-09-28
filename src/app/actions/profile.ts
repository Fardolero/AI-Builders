"use server";

import { revalidatePath } from "next/cache";
import { ROUTES, INTEREST_OPTIONS } from "@/constants/routes";
import { getCurrentUserAndProfile } from "@/lib/trocar/profile";

export type ProfileActionResult = {
  error: string | null;
};

export async function updateInterestsAction(
  interests: string[],
): Promise<ProfileActionResult> {
  const allowed = new Set(INTEREST_OPTIONS);
  const cleaned = interests
    .filter((item): item is (typeof INTEREST_OPTIONS)[number] =>
      allowed.has(item as (typeof INTEREST_OPTIONS)[number]),
    )
    .slice(0, 8);

  const { supabase, user } = await getCurrentUserAndProfile();
  if (!user) {
    return { error: "Tenés que iniciar sesión." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      interests: cleaned,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(ROUTES.profile);
  revalidatePath(ROUTES.saved);
  revalidatePath(ROUTES.matches);
  revalidatePath(ROUTES.feed);
  return { error: null };
}
