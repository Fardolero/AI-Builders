import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";
import { ROUTES } from "@/constants/routes";

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-16">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Crear cuenta</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Completa el formulario para registrarte. Los datos se guardan en{" "}
          <code className="font-mono">localStorage</code> de este navegador.
        </p>
      </div>
      <RegisterForm />
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        ¿Ya tienes cuenta?{" "}
        <Link
          href={ROUTES.login}
          className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100"
        >
          Iniciar sesión
        </Link>
      </p>
    </main>
  );
}
