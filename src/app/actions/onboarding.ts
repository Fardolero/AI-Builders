"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { getCurrentUserAndProfile } from "@/lib/trocar/profile";
import {
  onboardingSchema,
  type OnboardingFormValues,
} from "@/lib/validations/onboarding";

export type OnboardingActionResult = {
  error: string | null;
};

export async function completeOnboardingAction(
  input: OnboardingFormValues,
): Promise<OnboardingActionResult> {
  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Revisá el barrio, la bio y tus intereses." };
  }

  const { supabase, user, profile } = await getCurrentUserAndProfile();
  if (!user) {
    return { error: "Tenés que iniciar sesión." };
  }

  const nextName =
    parsed.data.fullName?.trim() ||
    profile?.full_name ||
    (typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : null);

  const { error } = await supabase
    .from("profiles")
    .update({
      barrio: parsed.data.barrio,
      bio: parsed.data.bio?.trim() || null,
      interests: parsed.data.interests,
      full_name: nextName,
      onboarding_completed_at:
        profile?.onboarding_completed_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect(ROUTES.feed);
}
