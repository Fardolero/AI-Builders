import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ExchangeChatClient } from "@/components/trocar/exchange-chat-client";
import { TrocarShell } from "@/components/trocar/shell";
import { ROUTES } from "@/constants/routes";
import { getCurrentUserAndProfile } from "@/lib/trocar/profile";

type ExchangePageProps = {
  params: Promise<{ id: string }>;
};

export default async function ExchangePage({ params }: ExchangePageProps) {
  const { id } = await params;
  const { supabase, user } = await getCurrentUserAndProfile();

  if (!user) {
    redirect(`${ROUTES.login}?next=${ROUTES.exchange(id)}`);
  }

  const { data: exchange } = await supabase
    .from("exchanges")
    .select(
      "id, status, offer_text, counter_text, proposer_id, owner_id, proposer_confirmed_at, owner_confirmed_at, post_id, post:posts!post_id(title)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!exchange) {
    notFound();
  }

  if (user.id !== exchange.proposer_id && user.id !== exchange.owner_id) {
    notFound();
  }

  const { data: messages } = await supabase
    .from("exchange_messages")
    .select("id, body, sender_id, created_at")
    .eq("exchange_id", id)
    .order("created_at", { ascending: true });

  const post = Array.isArray(exchange.post) ? exchange.post[0] : exchange.post;

  return (
    <TrocarShell
      rightSlot={
        <Link href={ROUTES.exchanges} className="text-sm text-white/80 hover:text-white">
          Mis intercambios
        </Link>
      }
    >
      <main className="trocar-fade-up mx-auto w-full max-w-lg space-y-4 py-4 pb-16">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
          Intercambio
        </h1>
        <ExchangeChatClient
          exchangeId={exchange.id}
          status={exchange.status}
          offerText={exchange.offer_text}
          counterText={exchange.counter_text}
          currentUserId={user.id}
          isOwner={user.id === exchange.owner_id}
          isProposer={user.id === exchange.proposer_id}
          proposerConfirmed={Boolean(exchange.proposer_confirmed_at)}
          ownerConfirmed={Boolean(exchange.owner_confirmed_at)}
          messages={messages ?? []}
          postTitle={post?.title ?? "Publicación"}
          postId={exchange.post_id}
        />
      </main>
    </TrocarShell>
  );
}
