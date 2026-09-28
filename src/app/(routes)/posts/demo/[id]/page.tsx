import Link from "next/link";
import { notFound } from "next/navigation";
import { TrocarButton } from "@/components/trocar/button";
import { TrocarShell } from "@/components/trocar/shell";
import { ROUTES } from "@/constants/routes";
import { getMockPost } from "@/lib/trocar/mock-posts";
import { getCurrentUserAndProfile } from "@/lib/trocar/profile";

type DemoPostPageProps = {
  params: Promise<{ id: string }>;
};

export default async function DemoPostPage({ params }: DemoPostPageProps) {
  const { id } = await params;
  const post = getMockPost(id);
  const { user } = await getCurrentUserAndProfile();

  if (!post) {
    notFound();
  }

  return (
    <TrocarShell
      rightSlot={
        <Link
          href={user ? ROUTES.feed : ROUTES.home}
          className="text-sm text-white/80 hover:text-white"
        >
          {user ? "Explorar" : "Inicio"}
        </Link>
      }
    >
      <main className="trocar-fade-up space-y-6">
        <div className="trocar-card space-y-3 p-5">
          <div className="flex flex-wrap gap-2 text-xs text-trocar-mute">
            <span className="rounded-full bg-trocar-mist-deep px-2 py-0.5 font-semibold text-trocar-accent uppercase">
              {post.kind}
            </span>
            <span>{post.barrio}</span>
            <span>· ejemplo</span>
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
            {post.title}
          </h1>
          <p className="text-trocar-mute">{post.description}</p>
        </div>

        <div className="trocar-card space-y-1 p-5">
          <p className="text-xs tracking-wide text-trocar-mute uppercase">Busca</p>
          <p className="text-lg text-trocar-paper">{post.looking_for}</p>
        </div>

        <div className="trocar-card space-y-1 p-5">
          <p className="text-xs tracking-wide text-trocar-mute uppercase">
            Publicado por
          </p>
          <p className="font-medium text-trocar-paper">{post.authorName}</p>
          {post.authorBio ? (
            <p className="text-sm text-trocar-mute">{post.authorBio}</p>
          ) : null}
        </div>

        <div className="trocar-card space-y-3 p-4">
          <p className="text-sm text-trocar-mute">
            Publicación de ejemplo para el piloto. Creá la tuya para proponer
            intercambios reales.
          </p>
          <div className="flex flex-wrap gap-2">
            {user ? (
              <>
                <TrocarButton href={ROUTES.postsNew}>Publicar la mía</TrocarButton>
                <TrocarButton href={ROUTES.feed} variant="secondary">
                  Volver al feed
                </TrocarButton>
              </>
            ) : (
              <>
                <TrocarButton href={ROUTES.register}>Crear cuenta</TrocarButton>
                <TrocarButton href={ROUTES.login} variant="secondary">
                  Ingresar
                </TrocarButton>
              </>
            )}
          </div>
        </div>
      </main>
    </TrocarShell>
  );
}
