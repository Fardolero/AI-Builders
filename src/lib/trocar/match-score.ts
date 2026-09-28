export function tokenize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9áéíóúñ]+/i)
    .filter((token) => token.length > 2);
}

export function lexicalOverlap(a: string, b: string) {
  const left = new Set(tokenize(a));
  const right = tokenize(b);
  if (left.size === 0 || right.length === 0) return 0;
  let hits = 0;
  for (const token of right) {
    if (left.has(token)) hits += 1;
  }
  return hits / Math.max(left.size, 1);
}

export function scoreExchangeProbability(input: {
  credits: number;
  avgRating: number | null;
  theirPosts: { title: string; looking_for: string; description?: string }[];
  myPosts: { title: string; looking_for: string }[];
}) {
  let overlap = 0;
  for (const mine of input.myPosts) {
    for (const theirs of input.theirPosts) {
      overlap = Math.max(
        overlap,
        lexicalOverlap(
          mine.looking_for,
          `${theirs.title} ${theirs.description ?? ""} ${theirs.looking_for}`,
        ),
        lexicalOverlap(theirs.looking_for, `${mine.title} ${mine.looking_for}`),
      );
    }
  }

  const creditScore = Math.min(input.credits / 50, 1) * 30;
  const ratingScore = ((input.avgRating ?? 3.5) / 5) * 30;
  const overlapScore = overlap * 40;
  return Math.round(
    Math.min(95, Math.max(35, creditScore + ratingScore + overlapScore)),
  );
}

export function scorePostMatch(
  myLookingFor: string,
  theirTitle: string,
  theirDescription: string,
) {
  const overlap = lexicalOverlap(
    myLookingFor,
    `${theirTitle} ${theirDescription}`,
  );
  return Math.round(Math.min(98, Math.max(40, overlap * 100)));
}
