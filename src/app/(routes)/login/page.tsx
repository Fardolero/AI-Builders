import { Suspense } from "react";
import Link from "next/link";
import {
  ArrowLeftRight,
  Coins,
  Search,
  Star,
} from "lucide-react";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { LoginForm } from "@/components/auth/login-form";
import { OtpRequestForm } from "@/components/auth/otp-request-form";
import { APP_NAME, ROUTES } from "@/constants/routes";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  Configuration: "No se pudo completar el login. Revisá la configuración.",
  AccessDenied: "Acceso rechazado.",
  Verification: "El enlace de verificación no es válido o expiró.",
  Default: "No se pudo iniciar sesión. Inténtalo de nuevo.",
};

const CORE_FEATURES = [
  {
    title: "Ofrecé y buscá",
    body: "Publicá lo que ya no usás o pedí lo que necesitás. Objetos y servicios, en tu barrio.",
    Icon: Search,
  },
  {
    title: "Match automático",
    body: "Trocar cruza lo que ofrecés con lo que buscan tus vecinos y te sugiere intercambios posibles.",
    Icon: ArrowLeftRight,
  },
  {
    title: "Créditos Vecinales",
    body: "Sumá créditos con cada trueque y usalos dentro de la app.",
    Icon: Coins,
  },
  {
    title: "Reputación vecinal",
    body: "Calificá y recibí calificaciones después de cada intercambio. Tu historial habla por vos.",
    Icon: Star,
  },
] as const;

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;
  const supabaseConfigured = isSupabaseConfigured();
  const errorMessage = error
    ? (AUTH_ERROR_MESSAGES[error] ?? AUTH_ERROR_MESSAGES.Default)
    : null;

  return (
    <div className="grid min-h-screen grid-cols-2 bg-trocar-mist text-trocar-paper">
      {/* Columna izquierda — información de la plataforma */}
      <aside className="relative flex min-h-screen flex-col justify-between gap-6 overflow-hidden bg-trocar-ink px-4 py-6 text-white sm:px-8 md:px-10 md:py-10 lg:px-14">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 0% 0%, rgb(62 223 194 / 22%), transparent 55%), radial-gradient(ellipse 60% 45% at 100% 100%, rgb(15 143 104 / 35%), transparent 50%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          aria-hidden
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgb(255 255 255 / 12%) 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />

        <div className="relative z-10 space-y-6 md:space-y-8">
          <Link
            href={ROUTES.home}
            className="inline-block font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-white"
          >
            {APP_NAME}
          </Link>

          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-[0.2em] text-trocar-mint uppercase">
              Trueque vecinal
            </p>
            <h1 className="max-w-md font-[family-name:var(--font-display)] text-2xl font-bold leading-tight sm:text-3xl lg:text-[2.35rem]">
              Intercambiá sin dinero, cerca de casa.
            </h1>
          </div>

          <ul className="space-y-3.5 md:space-y-4">
            {CORE_FEATURES.map(({ title, body, Icon }) => (
              <li key={title} className="flex gap-3">
                <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-trocar-mint ring-1 ring-white/15">
                  <Icon className="size-4" aria-hidden />
                </span>
                <div className="min-w-0 space-y-0.5">
                  <p className="font-semibold text-white">{title}</p>
                  <p className="text-sm leading-snug text-white/70">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 inline-flex max-w-fit items-center rounded-full border border-white/40 bg-transparent px-4 py-2 text-sm text-white/90">
          ✦ Próximamente, más funcionalidades y novedades.
        </p>
      </aside>

      {/* Columna derecha — login */}
      <section className="flex min-h-screen flex-col justify-center overflow-y-auto bg-trocar-mist px-4 py-6 sm:px-8 md:px-10 lg:px-14 xl:px-16">
        <div className="trocar-fade-up mx-auto w-full max-w-md space-y-5">
          <div className="space-y-2">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold sm:text-3xl">
              Ingresá tu cuenta
            </h2>
            <p className="text-sm text-trocar-mute">
              Continuá con Google o con tu correo y contraseña.
            </p>
          </div>

          {errorMessage ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </p>
          ) : null}
          {!supabaseConfigured ? (
            <p className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Faltan las claves de Supabase en{" "}
              <code className="font-mono">.env.local</code>.
            </p>
          ) : null}

          <Suspense fallback={null}>
            <GoogleSignInButton label="Iniciar sesión con Google" />
          </Suspense>

          <div className="flex items-center gap-3 text-xs tracking-wide text-trocar-mute uppercase">
            <span className="h-px flex-1 bg-trocar-line" />
            o con correo
            <span className="h-px flex-1 bg-trocar-line" />
          </div>

          <LoginForm />

          <div className="space-y-4 border-t border-trocar-line pt-5">
            <p className="text-sm text-trocar-mute">
              ¿Preferís un código por correo o celular?
            </p>
            <OtpRequestForm />
          </div>

          <p className="text-sm text-trocar-mute">
            ¿Preferís crear la cuenta con nombre y contraseña?{" "}
            <Link
              href={ROUTES.register}
              className="font-medium text-trocar-accent underline-offset-4 hover:underline"
            >
              Registro completo
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
