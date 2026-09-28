import { createClient } from "@/lib/supabase/server";
import { ROUTES } from "@/constants/routes";

export type TrocarProfile = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  barrio: string | null;
  bio: string | null;
  onboarding_completed_at: string | null;
  credits_balance: number | null;
  interests: string[] | null;
};

export async function getCurrentUserAndProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, profile: null as TrocarProfile | null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, full_name, username, avatar_url, barrio, bio, onboarding_completed_at, credits_balance, interests",
    )
    .eq("id", user.id)
    .maybeSingle();

  return {
    supabase,
    user,
    profile: (profile as TrocarProfile | null) ?? null,
  };
}

export function destinationAfterAuth(
  profile: Pick<TrocarProfile, "onboarding_completed_at"> | null,
) {
  if (!profile?.onboarding_completed_at) {
    return ROUTES.onboarding;
  }
  return ROUTES.feed;
}
