import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthButtons } from "@/components/shared/auth-buttons";
import { ROUTES } from "@/constants/routes";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect(ROUTES.login);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <AuthButtons />
      </div>
      <p className="text-zinc-600 dark:text-zinc-400">
        Sesión de {session.user.email ?? session.user.name}. Esta ruta está protegida
        por middleware y se vuelve a validar en el Server Component.
      </p>
    </main>
  );
}
