import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { ROUTES } from "@/constants/routes";
import { destinationAfterAuth } from "@/lib/trocar/profile";

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return null;
  }
  return value;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (!code || !isSupabaseConfigured()) {
    return NextResponse.redirect(`${origin}${ROUTES.login}?error=Verification`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}${ROUTES.login}?error=Verification`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let onboardingCompletedAt: string | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("onboarding_completed_at")
      .eq("id", user.id)
      .maybeSingle();
    onboardingCompletedAt = data?.onboarding_completed_at ?? null;

    // Backfill nombre/avatar de Google si el perfil quedó vacío
    const meta = user.user_metadata ?? {};
    const fullName =
      (typeof meta.full_name === "string" && meta.full_name) ||
      (typeof meta.name === "string" && meta.name) ||
      null;
    const avatarUrl =
      (typeof meta.avatar_url === "string" && meta.avatar_url) ||
      (typeof meta.picture === "string" && meta.picture) ||
      null;

    if (fullName || avatarUrl) {
      await supabase
        .from("profiles")
        .update({
          ...(fullName ? { full_name: fullName } : {}),
          ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .is("full_name", null);
    }
  }

  const destination = destinationAfterAuth(
    onboardingCompletedAt
      ? { onboarding_completed_at: onboardingCompletedAt }
      : { onboarding_completed_at: null },
  );

  // Solo respetar `next` si el onboarding ya está completo
  const target =
    onboardingCompletedAt && next ? next : destination;

  return NextResponse.redirect(`${origin}${target}`);
}
