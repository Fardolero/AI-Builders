function readPublicEnv(name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY") {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : undefined;
}

export function getSupabasePublicEnv() {
  return {
    url: readPublicEnv("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: readPublicEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  };
}

export function isSupabaseConfigured() {
  const { url, anonKey } = getSupabasePublicEnv();
  return Boolean(url && anonKey);
}

export function requireSupabasePublicEnv() {
  const { url, anonKey } = getSupabasePublicEnv();

  if (!url || !anonKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local",
    );
  }

  return { url, anonKey };
}
