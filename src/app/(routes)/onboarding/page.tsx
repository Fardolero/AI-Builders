import { OnboardingForm } from "@/components/trocar/onboarding-form";
import { TrocarShell } from "@/components/trocar/shell";
import { getCurrentUserAndProfile } from "@/lib/trocar/profile";

export default async function OnboardingPage() {
  const { profile, user } = await getCurrentUserAndProfile();
  const fullName =
    profile?.full_name ??
    (typeof user?.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : null);

  return (
    <TrocarShell>
      <main className="mx-auto w-full max-w-lg py-2">
        <OnboardingForm
          defaultBarrio={profile?.barrio}
          defaultBio={profile?.bio}
          defaultInterests={profile?.interests}
          fullName={fullName}
        />
      </main>
    </TrocarShell>
  );
}
