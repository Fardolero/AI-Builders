import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { RatingForm } from "@/components/trocar/rating-form";
import { TrocarShell } from "@/components/trocar/shell";
import { ROUTES } from "@/constants/routes";
import { getCurrentUserAndProfile } from "@/lib/trocar/profile";

type RatePageProps = {
  params: Promise<{ id: string }>;
};

export default async function RateExchangePage({ params }: RatePageProps) {
  const { id } = await params;
  const { supabase, user } = await getCurrentUserAndProfile();

  if (!user) {
    redirect(`${ROUTES.login}?next=${ROUTES.exchangeRate(id)}`);
  }

  const { data: exchange } = await supabase
    .from("exchanges")
    .select("id, status, proposer_id, owner_id")
    .eq("id", id)
    .maybeSingle();

  if (!exchange || exchange.status !== "completed") {
    notFound();
  }

  if (user.id !== exchange.proposer_id && user.id !== exchange.owner_id) {
    notFound();
  }

  const counterpartId =
    user.id === exchange.proposer_id ? exchange.owner_id : exchange.proposer_id;

  const { data: counterpart } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", counterpartId)
    .maybeSingle();

  const { data: existing } = await supabase
    .from("ratings")
    .select("id")
    .eq("exchange_id", id)
    .eq("from_user_id", user.id)
    .maybeSingle();

  return (
    <TrocarShell
      rightSlot={
        <Link href={ROUTES.profile} className="text-sm text-white/80 hover:text-white">
          Perfil
        </Link>
      }
    >
      <main className="trocar-fade-up mx-auto w-full max-w-lg space-y-6 py-4">
        <div className="space-y-2">
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
            Calificar
          </h1>
          <p className="text-sm text-trocar-mute">
            Trueque concretado. Dejá tu calificación y sumaste Créditos Vecinales.
          </p>
        </div>
        {existing ? (
          <p className="rounded-2xl border border-trocar-line p-4 text-sm text-trocar-accent">
            Ya calificaste este intercambio.{" "}
            <Link href={ROUTES.profile} className="underline">
              Ver perfil
            </Link>
          </p>
        ) : (
          <RatingForm
            exchangeId={id}
            counterpartName={counterpart?.full_name ?? "Vecino"}
          />
        )}
      </main>
    </TrocarShell>
  );
}
