"use client";

import { LogIn } from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function AuthButtons() {
  const { data: session, status } = useSession();

  if (status === "loading") {
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

  return (
    <Button onClick={() => void signIn("github")}>
      <LogIn className="size-4" aria-hidden />
      Continuar con GitHub
    </Button>
  );
}
