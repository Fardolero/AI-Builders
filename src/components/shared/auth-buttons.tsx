"use client";

import { LogIn } from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";
import { signOutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { useSupabaseUser } from "@/hooks/use-supabase-user";

function displayNameFromMetadata(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}) {
  const fullName = user.user_metadata?.full_name;
  if (typeof fullName === "string" && fullName.trim().length > 0) {
    return fullName;
  }

  return user.email ?? "cuenta";
}

export function AuthButtons() {
  const { data: session, status } = useSession();
  const { user: supabaseUser, isReady: isSupabaseReady } = useSupabaseUser();

  if (status === "loading" || !isSupabaseReady) {
    return (
      <Button variant="secondary" disabled>
        Cargando...
      </Button>
    );
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-zinc-600 dark:text-zinc-300">
          {session.user.name ?? session.user.email}
        </span>
        <Button variant="secondary" onClick={() => void signOut()}>
          Cerrar sesión
        </Button>
      </div>
    );
  }

  if (supabaseUser) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-zinc-600 dark:text-zinc-300">
          {displayNameFromMetadata(supabaseUser)}
        </span>
        <Button
          variant="secondary"
          onClick={() => {
            void signOutAction();
          }}
        >
          Cerrar sesión
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={() => void signIn("github")}>
      <LogIn className="size-4" aria-hidden />
      Continuar con GitHub
    </Button>
  );
}
