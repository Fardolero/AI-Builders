import { Suspense } from "react";
import Link from "next/link";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { RegisterForm } from "@/components/auth/register-form";
import { TrocarShell } from "@/components/trocar/shell";
import { ROUTES } from "@/constants/routes";

export default function RegisterPage() {
  return (
    <TrocarShell>
      <main className="trocar-fade-up mx-auto w-full max-w-md space-y-6 py-8">
        <div className="space-y-2">
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
            Crear cuenta
          </h1>
          <p className="text-sm text-trocar-mute">
            Registráte con Google o con correo para intercambiar en tu barrio.
          </p>
        </div>
        <Suspense fallback={null}>
          <GoogleSignInButton label="Registrarme con Google" />
        </Suspense>
        <div className="flex items-center gap-3 text-xs tracking-wide text-trocar-mute uppercase">
          <span className="h-px flex-1 bg-trocar-line" />
          o con correo
          <span className="h-px flex-1 bg-trocar-line" />
        </div>
        <RegisterForm />
        <p className="text-sm text-trocar-mute">
          ¿Ya tenés cuenta?{" "}
          <Link
            href={ROUTES.login}
            className="font-medium text-trocar-accent underline-offset-4 hover:underline"
          >
            Iniciar sesión
          </Link>
        </p>
      </main>
    </TrocarShell>
  );
}
