import Link from "next/link";
import { redirect } from "next/navigation";
import { OtpVerifyForm } from "@/components/auth/otp-verify-form";
import { TrocarShell } from "@/components/trocar/shell";
import { ROUTES } from "@/constants/routes";

type VerifyPageProps = {
  searchParams: Promise<{ channel?: string; to?: string }>;
};

export default async function VerifyLoginPage({ searchParams }: VerifyPageProps) {
  const { channel, to } = await searchParams;

  if ((channel !== "email" && channel !== "phone") || !to) {
    redirect(ROUTES.login);
  }

  const destination =
    channel === "email" ? to : to.replace(/(\+\d{2})(\d{2})(\d+)/, "$1 $2 $3");

  return (
    <TrocarShell
      rightSlot={
        <Link href={ROUTES.login} className="text-sm text-white/80 hover:text-white">
          Volver
        </Link>
      }
    >
      <main className="trocar-fade-up space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-[0.18em] text-trocar-accent uppercase">
            02
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
            Ingresá el código
          </h1>
          <p className="text-sm text-trocar-mute">
            Lo enviamos a <span className="text-trocar-paper">{destination}</span>.
          </p>
        </div>
        <OtpVerifyForm channel={channel} to={to} />
      </main>
    </TrocarShell>
  );
}
