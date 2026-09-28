import { redirect } from "next/navigation";
import { ProfileClient } from "@/components/trocar/profile-client";
import { TrocarShell } from "@/components/trocar/shell";
import { initialsFromName } from "@/components/trocar/ui-bits";
import { ROUTES } from "@/constants/routes";
import { deriveBadges, isTopNeighbor } from "@/lib/trocar/badges";
import { getCurrentUserAndProfile } from "@/lib/trocar/profile";

export default async function ProfilePage() {
  const { supabase, user, profile } = await getCurrentUserAndProfile();
  if (!user) {
    redirect(`${ROUTES.login}?next=${ROUTES.profile}`);
  }

  const [{ data: ratings }, { data: posts }, { count: exchangeCount }] =
    await Promise.all([
      supabase
        .from("ratings")
        .select(
          "stars, comment, created_at, from_user:profiles!from_user_id(full_name)",
        )
        .eq("to_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("posts")
        .select("id, kind, title, looking_for, barrio, status")
        .eq("author_id", user.id)
        .order("created_at", { ascending: false })
        .limit(12),
      supabase
        .from("exchanges")
        .select("id", { count: "exact", head: true })
        .eq("status", "completed")
        .or(`proposer_id.eq.${user.id},owner_id.eq.${user.id}`),
    ]);

  const avg =
    ratings && ratings.length > 0
      ? ratings.reduce((sum, item) => sum + item.stars, 0) / ratings.length
      : null;

  const credits = profile?.credits_balance ?? 0;
  const exchanges = exchangeCount ?? 0;
  const fullName = profile?.full_name ?? "Tu perfil";

  return (
    <TrocarShell
      showTabs
      title="Mi perfil"
      profileInitials={initialsFromName(fullName)}
    >
      <ProfileClient
        fullName={fullName}
        barrio={profile?.barrio ?? null}
        bio={profile?.bio ?? null}
        avatarUrl={profile?.avatar_url ?? null}
        credits={credits}
        exchanges={exchanges}
        avgRating={avg}
        topNeighbor={isTopNeighbor(credits)}
        badges={deriveBadges({
          credits,
          exchanges,
          avgRating: avg,
        })}
        posts={posts ?? []}
        interests={profile?.interests ?? []}
        ratings={(ratings ?? []).map((item) => {
          const from = Array.isArray(item.from_user)
            ? item.from_user[0]
            : item.from_user;
          return {
            stars: item.stars,
            comment: item.comment,
            created_at: item.created_at,
            from_name: from?.full_name ?? null,
          };
        })}
      />
    </TrocarShell>
  );
}
