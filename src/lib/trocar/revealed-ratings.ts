import type { SupabaseClient } from "@supabase/supabase-js";
import {
  filterRevealedRatings,
  type RatingRow,
} from "@/lib/trocar/rating-reveal";

export type RevealedRating = RatingRow & {
  from_name: string | null;
};

function displayName(fromUser: unknown): string | null {
  if (!fromUser) return null;
  if (Array.isArray(fromUser)) {
    const first = fromUser[0] as { full_name?: string | null } | undefined;
    return first?.full_name ?? null;
  }
  if (typeof fromUser === "object" && fromUser && "full_name" in fromUser) {
    const name = (fromUser as { full_name?: string | null }).full_name;
    return name ?? null;
  }
  return null;
}

function toRatingRow(row: {
  id: string;
  stars: number;
  comment: string | null;
  created_at: string;
  exchange_id: string;
  from_user_id: string;
  to_user_id: string;
}): RatingRow {
  return {
    id: row.id,
    stars: row.stars,
    comment: row.comment,
    created_at: row.created_at,
    exchange_id: row.exchange_id,
    from_user_id: row.from_user_id,
    to_user_id: row.to_user_id,
  };
}

export async function loadRevealedRatingsForUser(
  supabase: SupabaseClient,
  userId: string,
  limit = 40,
): Promise<{ ratings: RevealedRating[]; hiddenCount: number }> {
  const { data: ratingsRaw } = await supabase
    .from("ratings")
    .select(
      "id, stars, comment, created_at, exchange_id, from_user_id, to_user_id, from_user:profiles!from_user_id(full_name)",
    )
    .eq("to_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  const rows = ratingsRaw ?? [];
  if (rows.length === 0) {
    return { ratings: [], hiddenCount: 0 };
  }

  const exchangeIds = [...new Set(rows.map((row) => row.exchange_id as string))];
  const { data: siblings } = await supabase
    .from("ratings")
    .select(
      "id, stars, comment, created_at, exchange_id, from_user_id, to_user_id",
    )
    .in("exchange_id", exchangeIds);

  const revealedIds = new Set(
    filterRevealedRatings((siblings ?? []) as RatingRow[]).map(
      (rating) => rating.id,
    ),
  );

  const ratings = rows
    .filter((row) => revealedIds.has(row.id as string))
    .map((row) => ({
      ...toRatingRow({
        id: row.id as string,
        stars: row.stars as number,
        comment: (row.comment as string | null) ?? null,
        created_at: row.created_at as string,
        exchange_id: row.exchange_id as string,
        from_user_id: row.from_user_id as string,
        to_user_id: row.to_user_id as string,
      }),
      from_name: displayName(row.from_user),
    }));

  return { ratings, hiddenCount: rows.length - ratings.length };
}
