import { CreatePostForm } from "@/components/trocar/create-post-form";
import { TrocarShell } from "@/components/trocar/shell";
import { getCurrentUserAndProfile } from "@/lib/trocar/profile";

export default async function NewPostPage() {
  const { profile } = await getCurrentUserAndProfile();

  return (
    <TrocarShell showTabs title="Publicar">
      <main className="trocar-fade-up space-y-6">
        <p className="text-sm text-trocar-mute">
          Ofrecé un objeto o servicio y contá qué buscás a cambio.
        </p>
        <CreatePostForm defaultBarrio={profile?.barrio} />
      </main>
    </TrocarShell>
  );
}
