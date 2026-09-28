const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export type RatingRow = {
  id: string;
  stars: number;
  comment: string | null;
  created_at: string;
  exchange_id: string;
  from_user_id: string;
  to_user_id: string;
};

/**
 * Reveal rule from userflow: show rating when the other party also rated
 * the same exchange, or after 7 days — whichever comes first.
 */
export function filterRevealedRatings(
  ratings: RatingRow[],
  now = Date.now(),
): RatingRow[] {
  const byExchange = new Map<string, RatingRow[]>();
  for (const rating of ratings) {
    const list = byExchange.get(rating.exchange_id) ?? [];
    list.push(rating);
    byExchange.set(rating.exchange_id, list);
  }

  return ratings.filter((rating) => {
    const siblings = byExchange.get(rating.exchange_id) ?? [];
    const bothRated = siblings.length >= 2;
    const ageMs = now - new Date(rating.created_at).getTime();
    return bothRated || ageMs >= SEVEN_DAYS_MS;
  });
}
