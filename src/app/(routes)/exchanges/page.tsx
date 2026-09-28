import { redirect } from "next/navigation";
import { ExchangesClient } from "@/components/trocar/exchanges-client";
import { TrocarShell } from "@/components/trocar/shell";
import { ROUTES } from "@/constants/routes";
import { getCurrentUserAndProfile } from "@/lib/trocar/profile";

type ProfileEmbed = {
  full_name: string | null;
  avatar_url: string | null;
} | null;

type PostEmbed = {
  title: string | null;
  kind: "objeto" | "servicio" | null;
  intent: "ofrezco" | "busco" | null;
} | null;

function asOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export default async function ExchangesPage() {
  const { supabase, user } = await getCurrentUserAndProfile();
  if (!user) {
    redirect(`${ROUTES.login}?next=${ROUTES.exchanges}`);
  }

  const { data: exchanges } = await supabase
    .from("exchanges")
    .select(
      `
      id,
      status,
      offer_text,
      updated_at,
      proposer_id,
      owner_id,
      post:posts!post_id(title, kind, intent),
      proposer:profiles!proposer_id(full_name, avatar_url),
      owner:profiles!owner_id(full_name, avatar_url)
    `,
    )
    .or(`proposer_id.eq.${user.id},owner_id.eq.${user.id}`)
    .order("updated_at", { ascending: false });

  const items = (exchanges ?? []).map((item) => {
    const post = asOne(item.post as PostEmbed | PostEmbed[]);
    const proposer = asOne(item.proposer as ProfileEmbed | ProfileEmbed[]);
    const owner = asOne(item.owner as ProfileEmbed | ProfileEmbed[]);
    const isProposer = item.proposer_id === user.id;
    const counterpart = isProposer ? owner : proposer;

    return {
      id: item.id,
      status: item.status,
      offerText: item.offer_text,
      updatedAt: item.updated_at,
      postTitle: post?.title ?? "Publicación",
      postKind: post?.kind ?? null,
      postIntent: post?.intent ?? null,
      counterpartName: counterpart?.full_name ?? "Vecino",
      counterpartAvatar: counterpart?.avatar_url ?? null,
    };
  });

  return (
    <TrocarShell showTabs title="Mensajes">
      <main className="trocar-fade-up space-y-4 pb-8">
        <p className="text-sm text-trocar-mute">
          Tus propuestas y chats de intercambio.
        </p>
        <ExchangesClient items={items} />
      </main>
    </TrocarShell>
  );
}
