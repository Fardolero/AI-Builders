import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireSupabasePublicEnv } from "@/lib/supabase/env";

let cached: SupabaseClient | null = null;

/** Cliente service_role (bypassa RLS). Solo server-side. */
export function createServiceClient(): SupabaseClient | null {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key) return null;

  if (cached) return cached;

  const { url } = requireSupabasePublicEnv();
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

export function requireServiceClient(): SupabaseClient {
  const client = createServiceClient();
  if (!client) {
    throw new Error(
      "Falta SUPABASE_SERVICE_ROLE_KEY en .env.local (Dashboard → Settings → API)",
    );
  }
  return client;
}
