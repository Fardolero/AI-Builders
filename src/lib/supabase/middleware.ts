import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

function applyCacheHeaders(
  response: NextResponse,
  headers: Record<string, string>,
) {
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
}

export type SessionState = {
  response: NextResponse;
  isAuthenticated: boolean;
  userId: string | null;
  onboardingCompleted: boolean | null;
};

export async function updateSession(request: NextRequest): Promise<SessionState> {
  const { url, anonKey } = getSupabasePublicEnv();

  if (!url || !anonKey) {
    return {
      response: NextResponse.next({ request }),
      isAuthenticated: false,
      userId: null,
      onboardingCompleted: null,
    };
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
        applyCacheHeaders(supabaseResponse, headers);
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const userId =
    typeof data?.claims?.sub === "string" ? data.claims.sub : null;
  const isAuthenticated = Boolean(userId);

  let onboardingCompleted: boolean | null = null;
  if (userId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed_at")
      .eq("id", userId)
      .maybeSingle();

    onboardingCompleted = Boolean(profile?.onboarding_completed_at);
  }

  return {
    response: supabaseResponse,
    isAuthenticated,
    userId,
    onboardingCompleted,
  };
}
