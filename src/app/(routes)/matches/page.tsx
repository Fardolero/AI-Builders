import { redirect } from "next/navigation";
import { MatchesClient } from "@/components/trocar/matches-client";
import { TrocarShell } from "@/components/trocar/shell";
import { initialsFromName } from "@/components/trocar/ui-bits";
import { ROUTES } from "@/constants/routes";
import { getDashboard, type DashboardDTO } from "@/lib/matching/api";
import { ensureRegionFresh } from "@/lib/matching/recalc";
import { getCurrentUserAndProfile } from "@/lib/trocar/profile";

export default async function MatchesPage() {
  const { supabase, user, profile } = await getCurrentUserAndProfile();
  if (!user) {
    redirect(`${ROUTES.login}?next=${ROUTES.matches}`);
  }

  await ensureRegionFresh();

  let dashboard: DashboardDTO = {
    matches: [],
    demanda: [],
    demandaPrimero: true,
    actualizadoEn: null,
  };

  try {
    dashboard = await getDashboard(supabase, user.id);
  } catch (e) {
    console.error("[matches page]", e);
  }

  const { data: ratings } = await supabase
    .from("ratings")
    .select("stars")
    .eq("to_user_id", user.id);

  const avg =
    ratings && ratings.length > 0
      ? ratings.reduce((sum, item) => sum + item.stars, 0) / ratings.length
      : null;

  return (
    <TrocarShell
      showTabs
      title="Matches"
      profileInitials={initialsFromName(profile?.full_name)}
    >
      <MatchesClient
        credits={profile?.credits_balance ?? 0}
        avgRating={avg}
        initial={dashboard}
      />
    </TrocarShell>
  );
}
