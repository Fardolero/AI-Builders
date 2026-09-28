import Link from "next/link";
import { redirect } from "next/navigation";
import { TrocarShell } from "@/components/trocar/shell";
import { ROUTES } from "@/constants/routes";
import { getCurrentUserAndProfile } from "@/lib/trocar/profile";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek() {
  const d = startOfToday();
  d.setDate(d.getDate() - 7);
  return d;
}

export default async function NotificationsPage() {
  const { supabase, user } = await getCurrentUserAndProfile();
  if (!user) {
    redirect(`${ROUTES.login}?next=${ROUTES.notifications}`);
  }

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, title, body, href, read_at, created_at, type")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(40);

  const unreadIds = (notifications ?? [])
    .filter((item) => !item.read_at)
    .map((item) => item.id);

  if (unreadIds.length > 0) {
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .in("id", unreadIds)
      .eq("user_id", user.id);
  }

  const today = startOfToday().getTime();
  const week = startOfWeek().getTime();
  const todayItems = (notifications ?? []).filter(
    (item) => new Date(item.created_at).getTime() >= today,
  );
  const weekItems = (notifications ?? []).filter((item) => {
    const t = new Date(item.created_at).getTime();
    return t < today && t >= week;
  });
  const olderItems = (notifications ?? []).filter(
    (item) => new Date(item.created_at).getTime() < week,
  );

  const renderGroup = (title: string, items: typeof notifications) => {
    if (!items?.length) return null;
    return (
      <section className="space-y-2">
        <h2 className="text-xs font-semibold tracking-[0.16em] text-trocar-mute uppercase">
          {title}
        </h2>
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href ?? ROUTES.notifications}
                className={`trocar-card block px-4 py-3 ${
                  item.read_at ? "text-trocar-mute" : "ring-2 ring-trocar-mint/70"
                }`}
              >
                <p className="font-medium text-trocar-paper">{item.title}</p>
                <p className="text-sm opacity-80">{item.body}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    );
  };

  return (
    <TrocarShell showTabs title="Notificaciones">
      <main className="trocar-fade-up space-y-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-trocar-mute">
            {unreadIds.length > 0
              ? `${unreadIds.length} sin leer (marcadas al entrar)`
              : "Todas leídas"}
          </p>
        </div>
        {!notifications?.length ? (
          <p className="text-trocar-mute">No tenés notificaciones todavía.</p>
        ) : (
          <div className="space-y-6">
            {renderGroup("Hoy", todayItems)}
            {renderGroup("Esta semana", weekItems)}
            {renderGroup("Anteriores", olderItems)}
          </div>
        )}
      </main>
    </TrocarShell>
  );
}
