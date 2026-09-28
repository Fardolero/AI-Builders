import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ProposeExchangeForm } from "@/components/trocar/propose-exchange-form";
import { TrocarShell } from "@/components/trocar/shell";
import { ROUTES } from "@/constants/routes";
import { getCurrentUserAndProfile } from "@/lib/trocar/profile";

type ProposePageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProposePage({ params }: ProposePageProps) {
  const { id } = await params;
  const { supabase, user, profile } = await getCurrentUserAndProfile();

  if (!user) {
    redirect(`${ROUTES.login}?next=${ROUTES.postPropose(id)}`);
  }

  if (!profile?.onboarding_completed_at) {
    redirect(ROUTES.onboarding);
  }

  const { data: post } = await supabase
    .from("posts")
    .select("id, title, author_id, status")
    .eq("id", id)
    .maybeSingle();

  if (!post || post.status !== "activa") {
    notFound();
  }

  if (post.author_id === user.id) {
    redirect(ROUTES.post(id));
  }

  const { data: ownPosts } = await supabase
    .from("posts")
    .select("id, title, looking_for")
    .eq("author_id", user.id)
    .eq("status", "activa")
    .order("created_at", { ascending: false })
    .limit(12);

  const { data: existing } = await supabase
    .from("exchanges")
    .select("id")
    .eq("post_id", id)
    .eq("proposer_id", user.id)
    .in("status", ["pending", "countered", "accepted", "coordinating"])
    .maybeSingle();

  if (existing) {
    redirect(ROUTES.exchange(existing.id));
  }

  return (
    <TrocarShell
      rightSlot={
        <Link href={ROUTES.post(id)} className="text-sm text-white/80 hover:text-white">
          Volver
        </Link>
      }
    >
      <main className="trocar-fade-up mx-auto w-full max-w-lg space-y-6 py-4">
        <div className="space-y-2">
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
            Proponer intercambio
          </h1>
          <p className="text-sm text-trocar-mute">
            Elegí qué ofrecés. El vecino podrá aceptar, rechazar o contraofertar.
          </p>
        </div>
        <ProposeExchangeForm
          postId={post.id}
          postTitle={post.title}
          ownPosts={ownPosts ?? []}
        />
      </main>
    </TrocarShell>
  );
}
