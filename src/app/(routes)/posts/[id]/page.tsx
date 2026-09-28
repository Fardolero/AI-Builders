import Link from "next/link";
import { notFound } from "next/navigation";
import { ContactConfirmedBadge } from "@/components/trocar/contact-confirmed-badge";
import { PostOwnerActions } from "@/components/trocar/post-owner-actions";
import { ReportBlockMenu } from "@/components/trocar/report-block-menu";
import { SavePostButton } from "@/components/trocar/save-post-button";
import { TrocarButton } from "@/components/trocar/button";
import { TrocarShell } from "@/components/trocar/shell";
import { MEETING_POINTS, ROUTES } from "@/constants/routes";
import { getCurrentUserAndProfile } from "@/lib/trocar/profile";

type PostDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { id } = await params;
  const { supabase, user } = await getCurrentUserAndProfile();

  const { data: post } = await supabase
    .from("posts")
    .select(
      "id, kind, intent, title, description, looking_for, barrio, status, created_at, author_id, meeting_point_id, image_url, category, condition, author:profiles!author_id(full_name, barrio, bio, onboarding_completed_at)",
    )
    .eq("id", id)
    .maybeSingle();

  if (
    !post ||
    (post.status !== "activa" &&
      post.status !== "moderado" &&
      user?.id !== post.author_id)
  ) {
    notFound();
  }

  if (post.status === "moderado" && user?.id !== post.author_id) {
    notFound();
  }

  const author = Array.isArray(post.author) ? post.author[0] : post.author;
  const isOwner = user?.id === post.author_id;
  const meetingPoint = MEETING_POINTS.find(
    (point) => point.id === post.meeting_point_id,
  );

  let saved = false;
  if (user) {
    const { data: savedRow } = await supabase
      .from("saved_posts")
      .select("id")
      .eq("user_id", user.id)
      .eq("post_id", post.id)
      .maybeSingle();
    saved = Boolean(savedRow);
  }

  const { data: authorRatings } = await supabase
    .from("ratings")
    .select("stars")
    .eq("to_user_id", post.author_id);

  const ratingCount = authorRatings?.length ?? 0;
  const ratingAvg =
    ratingCount > 0
      ? authorRatings!.reduce((sum, row) => sum + row.stars, 0) / ratingCount
      : null;

  return (
    <TrocarShell
      rightSlot={
        <div className="flex items-center gap-2">
          {user && !isOwner ? (
            <SavePostButton postId={post.id} initiallySaved={saved} />
          ) : null}
          <Link
            href={user ? ROUTES.feed : ROUTES.home}
            className="text-sm text-white/80 hover:text-white"
          >
            {user ? "Inicio" : "Inicio"}
          </Link>
        </div>
      }
    >
      <main className="trocar-fade-up mx-auto w-full max-w-lg space-y-8 py-4 pb-16">
        <div className="relative overflow-hidden rounded-[1.5rem]">
          {post.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.image_url}
              alt={post.title}
              className="aspect-[4/3] w-full object-cover"
            />
          ) : (
            <div className="flex aspect-[4/3] items-end bg-gradient-to-br from-trocar-mist-deep to-trocar-paper-dim p-4">
              <span className="rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold uppercase text-trocar-accent">
                {post.intent === "busco" ? "Busco" : "Ofrezco"}
              </span>
            </div>
          )}
          {user && !isOwner ? (
            <div className="absolute top-3 right-3">
              <ReportBlockMenu
                targetUserId={post.author_id}
                targetPostId={post.id}
              />
            </div>
          ) : null}
        </div>

        <div className="trocar-card space-y-3 p-5">
          <div className="flex flex-wrap gap-2 text-xs text-trocar-mute">
            <span className="rounded-full bg-trocar-mist-deep px-2 py-0.5 font-semibold text-trocar-accent uppercase">
              {post.intent === "busco" ? "Busco" : "Ofrezco"}
            </span>
            <span className="rounded-full bg-white px-2 py-0.5 ring-1 ring-trocar-line">
              {post.kind}
            </span>
            {post.category ? <span>{post.category}</span> : null}
            <span>{post.barrio}</span>
            {post.status === "moderado" ? (
              <span className="text-red-600">Moderado</span>
            ) : (
              <span>· {post.status}</span>
            )}
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
            {post.title}
          </h1>
          <p className="text-trocar-mute">{post.description}</p>
          {post.condition ? (
            <p className="text-sm text-trocar-mute">
              Condición: {post.condition.replace("_", " ")}
            </p>
          ) : null}
        </div>

        <div className="trocar-card space-y-1 p-5">
          <p className="text-xs tracking-wide text-trocar-mute uppercase">
            Busca a cambio
          </p>
          <p className="text-lg text-trocar-paper">{post.looking_for}</p>
        </div>

        {meetingPoint ? (
          <div className="trocar-card space-y-1 p-5">
            <p className="text-xs tracking-wide text-trocar-mute uppercase">
              Punto de encuentro
            </p>
            <p className="text-lg text-trocar-paper">{meetingPoint.label}</p>
            <p className="text-sm text-trocar-mute">{meetingPoint.barrio}</p>
          </div>
        ) : null}

        <div className="trocar-card space-y-2 p-5">
          <p className="text-xs tracking-wide text-trocar-mute uppercase">
            Publicado por
          </p>
          <Link
            href={ROUTES.profilePublic(post.author_id)}
            className="font-medium text-trocar-paper hover:text-trocar-accent"
          >
            {author?.full_name ?? "Vecino"}
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            {ratingAvg !== null ? (
              <span className="text-sm text-trocar-mute">
                {"★".repeat(Math.round(ratingAvg))}
                {"☆".repeat(5 - Math.round(ratingAvg))} · {ratingCount}
              </span>
            ) : (
              <span className="text-sm text-trocar-mute">
                Aún sin calificaciones suficientes
              </span>
            )}
            <ContactConfirmedBadge
              emailConfirmed={Boolean(author?.onboarding_completed_at)}
            />
          </div>
          {author?.bio ? (
            <p className="text-sm text-trocar-mute">{author.bio}</p>
          ) : null}
        </div>

        {isOwner ? (
          <PostOwnerActions
            postId={post.id}
            status={post.status}
            kind={post.kind}
            title={post.title}
            description={post.description}
            lookingFor={post.looking_for}
            barrio={post.barrio}
            meetingPointId={post.meeting_point_id}
          />
        ) : user ? (
          <div className="trocar-card space-y-3 p-4">
            <p className="text-sm text-trocar-mute">
              ¿Te interesa? Proponé qué ofrecés a cambio.
            </p>
            <div className="flex flex-wrap gap-2">
              <TrocarButton href={ROUTES.postPropose(post.id)}>
                Proponer intercambio
              </TrocarButton>
              <TrocarButton href={ROUTES.feed} variant="secondary">
                Volver al feed
              </TrocarButton>
            </div>
          </div>
        ) : (
          <div className="trocar-card space-y-3 p-4">
            <p className="text-sm text-trocar-mute">
              Creá una cuenta o iniciá sesión para proponer un intercambio.
            </p>
            <div className="flex flex-wrap gap-2">
              <TrocarButton href={ROUTES.register}>Crear cuenta</TrocarButton>
              <TrocarButton href={ROUTES.login} variant="secondary">
                Ingresar
              </TrocarButton>
            </div>
          </div>
        )}
      </main>
    </TrocarShell>
  );
}
