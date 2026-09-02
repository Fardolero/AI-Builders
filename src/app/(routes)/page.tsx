import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { AuthButtons } from "@/components/shared/auth-buttons";
import { APP_NAME, ROUTES } from "@/constants/routes";
import { cn } from "@/lib/cn";

const linkButton =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-10 px-6 py-16">
      <header className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium tracking-wide text-zinc-500 uppercase">
          {APP_NAME}
        </p>
        <AuthButtons />
      </header>

      <section className="space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight">
          Next.js 15 listo para producción
        </h1>
        <p className="max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
          App Router, TypeScript estricto, Tailwind v4, Auth.js v5, Prisma/PostgreSQL,
          Vitest y Playwright. Conecta GitHub y Vercel para CI/CD.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href={ROUTES.dashboard}
            className={cn(
              linkButton,
              "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900",
            )}
          >
            Ir al dashboard
            <ArrowRight className="size-4" aria-hidden />
          </Link>
          <Link
            href={ROUTES.login}
            className={cn(
              linkButton,
              "border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100",
            )}
          >
            Iniciar sesión
          </Link>
        </div>
      </section>
    </main>
  );
}
