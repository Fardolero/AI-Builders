import { AuthButtons } from "@/components/shared/auth-buttons";
import { isGitHubOAuthConfigured } from "@/lib/github-oauth";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const githubOAuthConfigured = isGitHubOAuthConfigured();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6">
      <h1 className="text-2xl font-semibold">Iniciar sesión</h1>
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
    </main>
  );
}
