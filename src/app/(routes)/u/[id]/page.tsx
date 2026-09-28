import Link from "next/link";
import { notFound } from "next/navigation";
import { ContactConfirmedBadge } from "@/components/trocar/contact-confirmed-badge";
import { ReportBlockMenu } from "@/components/trocar/report-block-menu";
import { TrocarButton } from "@/components/trocar/button";
import { PostGridCard } from "@/components/trocar/post-grid-card";
import { TrocarShell } from "@/components/trocar/shell";
import { AvatarBadge, StatPill } from "@/components/trocar/ui-bits";
import { ROUTES } from "@/constants/routes";
import { BadgeRow, deriveBadges, isTopNeighbor } from "@/lib/trocar/badges";
import { getCurrentUserAndProfile } from "@/lib/trocar/profile";
import { loadContactConfirmation } from "@/lib/trocar/contact-flags";
import { scoreExchangeProbability } from "@/lib/trocar/match-score";
import { loadRevealedRatingsForUser } from "@/lib/trocar/revealed-ratings";

type PublicProfilePageProps = {
  params: Promise<{ id: string }>;
};

export default async function PublicProfilePage({
  params,
}: PublicProfilePageProps) {
  const { id } = await params;
  const { supabase, user, profile: viewer } = await getCurrentUserAndProfile();

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, full_name, barrio, bio, credits_balance, avatar_url, interests",
    )
    .eq("id", id)
    .maybeSingle();

  if (!profile) {
    notFound();
  }

  const [{ ratings }, contactFlags, { data: posts }, { count: exchangeCount }] =
    await Promise.all([
      loadRevealedRatingsForUser(supabase, id, 40),
      loadContactConfirmation(supabase, id),
      supabase
        .from("posts")
        .select(
          "id, title, kind, barrio, looking_for, status, image_url, intent",
        )
        .eq("author_id", id)
        .eq("status", "activa")
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("exchanges")
        .select("id", { count: "exact", head: true })
        .eq("status", "completed")
        .or(`proposer_id.eq.${id},owner_id.eq.${id}`),
    ]);

  let viewerPosts: { title: string; looking_for: string }[] = [];
  if (user) {
    const { data } = await supabase
      .from("posts")
      .select("title, looking_for")
      .eq("author_id", user.id)
      .eq("status", "activa");
    viewerPosts = data ?? [];
  }

  const avg =
    ratings.length > 0
      ? ratings.reduce((sum, item) => sum + item.stars, 0) / ratings.length
      : null;
  const credits = profile.credits_balance ?? 0;
  const exchanges = exchangeCount ?? 0;
  const probability = scoreExchangeProbability({
    credits,
    avgRating: avg,
    theirPosts: posts ?? [],
    myPosts: viewerPosts,
  });

  const firstActive = posts?.[0];
  const enoughRatings = ratings.length >= 3;

  return (
    <TrocarShell
      rightSlot={
        <div className="flex items-center gap-2">
          {user && user.id !== id ? (
            <ReportBlockMenu targetUserId={id} />
          ) : null}
          <Link
            href={ROUTES.feed}
            className="text-sm text-white/80 hover:text-white"
          >
            Inicio
          </Link>
        </div>
      }
    >
      <main className="trocar-fade-up space-y-6 pb-24">
        <div className="flex flex-col items-center gap-3 text-center">
          <AvatarBadge
            name={profile.full_name}
            avatarUrl={profile.avatar_url}
            size="lg"
            badge={isTopNeighbor(credits) ? "Top vecino" : null}
          />
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
              {profile.full_name ?? "Vecino"}
            </h1>
            <p className="text-sm text-trocar-mute">
              {profile.barrio ?? "Barrio"}
              {viewer?.barrio && profile.barrio === viewer.barrio
                ? " · mismo barrio"
                : ""}
            </p>
            <div className="mt-2 flex justify-center">
              <ContactConfirmedBadge {...contactFlags} />
            </div>
            {profile.bio ? (
              <p className="mt-2 text-sm text-trocar-paper">{profile.bio}</p>
            ) : null}
          </div>
        </div>

        <div className="rounded-full bg-trocar-ink px-4 py-3 text-center text-sm font-semibold text-white">
          {probability}% de probabilidad de intercambio
        </div>

        <div className="flex gap-2">
          <StatPill value={String(credits)} label="Créditos" />
          <StatPill value={String(exchanges)} label="Intercambios" />
          <StatPill
            value={enoughRatings && avg !== null ? avg.toFixed(1) : "—"}
            label="Calificación"
          />
        </div>

        <BadgeRow
          badges={deriveBadges({
            credits,
            exchanges,
            avgRating: enoughRatings ? avg : null,
          })}
        />

        <section className="space-y-3">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
            Publicaciones
          </h2>
          {!posts?.length ? (
            <p className="text-sm text-trocar-mute">Sin publicaciones activas.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {posts.map((post) => (
                <div key={post.id} className="space-y-2">
                  <PostGridCard post={post} />
                  {user && user.id !== id ? (
                    <TrocarButton
                      href={ROUTES.postPropose(post.id)}
                      variant="secondary"
                      className="w-full text-xs"
                    >
                      Proponer
                    </TrocarButton>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
            Reseñas de vecinos
          </h2>
          {!enoughRatings ? (
            <p className="text-sm text-trocar-mute">
              Aún sin calificaciones suficientes
            </p>
          ) : !ratings.length ? (
            <p className="text-sm text-trocar-mute">
              Las calificaciones se revelan cuando ambas partes califican, o a
              los 7 días.
            </p>
          ) : (
            <ul className="space-y-2">
              {ratings.map((item, index) => {
                return (
                  <li
                    key={`${item.created_at}-${index}`}
                    className="trocar-card p-3 text-sm"
                  >
                    <p className="font-semibold text-trocar-paper">
                      {item.from_name ?? "Vecino"} · {"★".repeat(item.stars)}
                    </p>
                    {item.comment ? (
                      <p className="mt-1 text-trocar-mute">{item.comment}</p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>

      {user && user.id !== id && firstActive ? (
        <div className="fixed bottom-4 left-1/2 z-30 flex w-[min(24rem,calc(100%-2rem))] -translate-x-1/2 gap-2">
          <TrocarButton
            href={ROUTES.postPropose(firstActive.id)}
            className="flex-1"
          >
            Proponer intercambio
          </TrocarButton>
        </div>
      ) : null}
    </TrocarShell>
  );
}
