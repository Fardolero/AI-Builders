import { AuthButtons } from "@/components/shared/auth-buttons";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6">
      <h1 className="text-2xl font-semibold">Iniciar sesión</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Usa GitHub OAuth. Configura <code>AUTH_GITHUB_ID</code> y{" "}
        <code>AUTH_GITHUB_SECRET</code> en tu entorno.
      </p>
      <AuthButtons />
    </main>
  );
}
