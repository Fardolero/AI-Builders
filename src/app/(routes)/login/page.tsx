import Link from "next/link";
import { AuthButtons } from "@/components/shared/auth-buttons";
import { ROUTES } from "@/constants/routes";
import { isGitHubOAuthConfigured } from "@/lib/github-oauth";

export const dynamic = "force-dynamic";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  Configuration:
    "Auth.js no pudo completar el login. En local suele ser porque no hay PostgreSQL; el login con GitHub ahora usa JWT sin base de datos.",
  AccessDenied: "GitHub rechazó el acceso.",
  Verification: "El enlace de verificación no es válido o expiró.",
  Default: "No se pudo iniciar sesión. Inténtalo de nuevo.",
};

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;
  const githubOAuthConfigured = isGitHubOAuthConfigured();
  const errorMessage = error
    ? (AUTH_ERROR_MESSAGES[error] ?? AUTH_ERROR_MESSAGES.Default)
    : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6">
      <h1 className="text-2xl font-semibold">Iniciar sesión</h1>
      {errorMessage ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {errorMessage}
        </p>
      ) : null}
      {githubOAuthConfigured ? (
        <>
          <p className="text-zinc-600 dark:text-zinc-400">
            Entra con tu cuenta de GitHub.
          </p>
          <AuthButtons />
        </>
      ) : (
        <div className="space-y-4 text-sm text-zinc-600 dark:text-zinc-400">
          <p>
            Este entorno no tiene las credenciales de GitHub OAuth. Las variables de
            Vercel <strong>no se usan en localhost</strong>: aquí hace falta{" "}
            <code className="font-mono">.env</code>.
          </p>
          <p className="font-medium text-zinc-800 dark:text-zinc-200">Nombres exactos</p>
          <ul className="list-disc pl-5">
            <li>
              <code className="font-mono">AUTH_GITHUB_ID</code>
            </li>
            <li>
              <code className="font-mono">AUTH_GITHUB_SECRET</code>
            </li>
          </ul>
          <p>
            Local: pégalas en <code className="font-mono">.env</code> y reinicia{" "}
            <code className="font-mono">npm run dev</code>.
          </p>
          <p>
            Vercel: márcalas en Production (y Preview si usas PRs), luego{" "}
            <strong>Redeploy</strong>. El callback debe ser{" "}
            <code className="font-mono">https://TU-DOMINIO/api/auth/callback/github</code>
            .
          </p>
        </div>
      )}
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        ¿No tienes cuenta?{" "}
        <Link
          href={ROUTES.register}
          className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100"
        >
          Crear cuenta
        </Link>
      </p>
    </main>
  );
}
