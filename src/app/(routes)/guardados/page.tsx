import { SavedClient } from "@/components/trocar/saved-client";
import { TrocarShell } from "@/components/trocar/shell";
import { initialsFromName } from "@/components/trocar/ui-bits";
import { getCurrentUserAndProfile } from "@/lib/trocar/profile";
import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

export default async function SavedPage() {
  const { supabase, user, profile } = await getCurrentUserAndProfile();
  if (!user) {
    redirect(`${ROUTES.login}?next=${ROUTES.saved}`);
  }

  const { data: saved } = await supabase
    .from("saved_posts")
    .select(
      "post:posts!post_id(id, kind, title, looking_for, barrio, status)",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const posts = (saved ?? [])
    .map((row) => (Array.isArray(row.post) ? row.post[0] : row.post))
    .flatMap((post) =>
      post && post.status === "activa" ? [post] : [],
    );

  return (
    <TrocarShell
      showTabs
      title="Guardados"
      profileInitials={initialsFromName(profile?.full_name)}
    >
      <SavedClient posts={posts} interests={profile?.interests ?? []} />
    </TrocarShell>
  );
}
