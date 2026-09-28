import { ExploreFeed } from "@/components/trocar/explore-feed";
import { TrocarShell } from "@/components/trocar/shell";
import { ROUTES } from "@/constants/routes";
import { scorePostMatch } from "@/lib/trocar/match-score";
import {
  MOCK_POSTS,
  mockPostHref,
  toFeedMockPosts,
} from "@/lib/trocar/mock-posts";
import { getCurrentUserAndProfile } from "@/lib/trocar/profile";

export default async function FeedPage() {
  const { supabase, user, profile } = await getCurrentUserAndProfile();

  const [{ data: posts }, { data: myPosts }] = await Promise.all([
    supabase
      .from("posts")
      .select(
        "id, kind, intent, title, description, looking_for, barrio, status, created_at, meeting_point_id, image_url, category, author:profiles!author_id(full_name)",
      )
      .eq("status", "activa")
      .order("created_at", { ascending: false })
      .limit(50),
    user
      ? supabase
          .from("posts")
          .select("looking_for")
          .eq("author_id", user.id)
          .eq("status", "activa")
      : Promise.resolve({ data: [] as { looking_for: string }[] }),
  ]);

  let savedPostIds: string[] = [];
  if (user) {
    const { data: saved } = await supabase
      .from("saved_posts")
      .select("post_id")
      .eq("user_id", user.id);
    savedPostIds = (saved ?? []).map((row) => row.post_id);
  }

  const displayName =
    profile?.full_name ??
    (typeof user?.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : null) ??
    user?.email ??
    "vecino";

  const lookingBag =
    (myPosts ?? []).map((post) => post.looking_for).join(" ") ||
    (profile?.interests ?? []).join(" ") ||
    "herramientas libros clases plantas bicicleta notebook guitarra";

  const realPosts = (posts ?? []).map((post) => ({
    ...post,
    meetingPointId: post.meeting_point_id ?? null,
    author: Array.isArray(post.author) ? post.author[0] ?? null : post.author,
  }));

  const mockPosts = toFeedMockPosts();
  const mergedPosts = [...realPosts, ...mockPosts];

  const recentMatches = [
    ...realPosts.map((post) => {
      const score = scorePostMatch(
        lookingBag,
        post.title,
        `${post.description} ${post.looking_for}`,
      );
      return {
        id: post.id,
        title: post.title,
        name: post.author?.full_name ?? "Vecino",
        score,
        barrio: post.barrio,
        href: ROUTES.post(post.id),
        kind: post.kind,
      };
    }),
    ...MOCK_POSTS.map((post) => {
      const score = scorePostMatch(
        lookingBag,
        post.title,
        `${post.description} ${post.looking_for}`,
      );
      return {
        id: post.id,
        title: post.title,
        name: post.authorName,
        score,
        barrio: post.barrio,
        href: mockPostHref(post.id),
        kind: post.kind,
      };
    }),
  ]
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  return (
    <TrocarShell showNav={false} showTabs>
      <ExploreFeed
        posts={mergedPosts}
        recentMatches={recentMatches}
        barrio={profile?.barrio ?? null}
        displayName={displayName}
        lookingBag={lookingBag}
        savedPostIds={savedPostIds}
      />
    </TrocarShell>
  );
}
