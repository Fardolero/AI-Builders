import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Home, Shield } from "lucide-react";
import { auth } from "@/auth";
import { AuthButtons } from "@/components/shared/auth-buttons";
import { APP_NAME, ROUTES } from "@/constants/routes";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect(ROUTES.login);
  }

  const { name, email, image } = session.user;
  const displayName = name ?? email ?? "cuenta";

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium tracking-wide text-zinc-500 uppercase">
            {APP_NAME}
          </p>
          <h1 className="text-2xl font-semibold">Panel</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={ROUTES.home}
            className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
          >
            <Home className="size-4" aria-hidden />
            Inicio
          </Link>
          <AuthButtons />
        </div>
      </header>

      <section className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        {image ? (
          <Image
            src={image}
            alt=""
            width={64}
            height={64}
            className="size-16 rounded-full"
          />
        ) : (
          <div className="flex size-16 items-center justify-center rounded-full bg-zinc-100 text-lg font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
            {displayName.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-sm text-zinc-500">Sesión iniciada</p>
          <p className="text-xl font-medium">{displayName}</p>
          {email && name ? (
            <p className="text-sm text-zinc-500">{email}</p>
          ) : null}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <article className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <div className="mb-2 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-5" aria-hidden />
            <h2 className="font-medium">GitHub OAuth</h2>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Autenticación con GitHub activa. Ya puedes usar rutas privadas.
          </p>
        </article>
        <article className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <div className="mb-2 flex items-center gap-2 text-zinc-800 dark:text-zinc-100">
            <Shield className="size-5" aria-hidden />
            <h2 className="font-medium">Ruta privada</h2>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Solo usuarios con sesión ven este panel. El siguiente paso es conectar
            PostgreSQL para guardar posts y usuarios.
          </p>
        </article>
      </section>
    </main>
  );
}
