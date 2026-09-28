import Link from "next/link";
import {
  ArrowRight,
  Camera,
  Heart,
  MessageCircle,
  WalletCards,
} from "lucide-react";
import { LandingContactForm } from "@/components/trocar/landing-contact-form";
import { LandingFaq } from "@/components/trocar/landing-faq";
import { LandingPostCard } from "@/components/trocar/landing-post-card";
import { TrocarButton } from "@/components/trocar/button";
import { APP_NAME, ROUTES } from "@/constants/routes";
import { createClient } from "@/lib/supabase/server";
import { MOCK_POSTS } from "@/lib/trocar/mock-posts";
import { getCurrentUserAndProfile } from "@/lib/trocar/profile";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { PostCardData } from "@/components/trocar/post-card";

const HOW_IT_WORKS = [
  {
    id: "publish",
    title: "Publicá lo tuyo",
    body: "Subí el detalle de un objeto o servicio que ya no uses o quieras ofrecer.",
    Icon: Camera,
  },
  {
    id: "chat",
    title: "Chateá y acordá",
    body: "Mirá lo que necesitás y proponé un intercambio directo con otro vecino.",
    Icon: MessageCircle,
  },
  {
    id: "credits",
    title: "Sumá Créditos",
    body: "Cada trueque exitoso otorga Créditos Vecinales que validan tu reputación.",
    Icon: WalletCards,
  },
] as const;

export default async function HomePage() {
  const { user, profile } = isSupabaseConfigured()
    ? await getCurrentUserAndProfile()
    : { user: null, profile: null };

  let posts: PostCardData[] = [];

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("posts")
      .select(
        "id, kind, title, description, looking_for, barrio, status, created_at",
      )
      .eq("status", "activa")
      .order("created_at", { ascending: false })
      .limit(8);
    posts = data ?? [];
  }

  const displayPosts: PostCardData[] =
    posts.length >= 4
      ? posts
      : [...posts, ...MOCK_POSTS].slice(0, 8);

  const isLoggedIn = Boolean(user);
  const primaryHref = isLoggedIn
    ? profile?.onboarding_completed_at
      ? ROUTES.feed
      : ROUTES.onboarding
    : ROUTES.register;

  return (
    <div className="min-h-screen bg-trocar-mist text-trocar-soil">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-5 py-5 sm:px-8">
        <Link
          href={ROUTES.home}
          className="font-[family-name:var(--font-serif)] text-2xl font-semibold tracking-tight text-trocar-leaf"
        >
          {APP_NAME}
        </Link>
        <TrocarButton
          href={isLoggedIn ? primaryHref : ROUTES.login}
          className="rounded-full bg-trocar-leaf px-5 text-white hover:bg-trocar-leaf-deep"
        >
          {isLoggedIn ? "Ir al feed" : "Ingresar"}
        </TrocarButton>
      </header>

      <main>
        <section className="mx-auto grid w-full max-w-3xl gap-8 px-5 pt-4 pb-14 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div className="trocar-fade-up space-y-6">
            <p className="text-xs font-semibold tracking-[0.22em] text-trocar-mute uppercase">
              Mar del Plata · Argentina
            </p>
            <h1 className="font-[family-name:var(--font-serif)] text-4xl leading-[1.1] font-semibold text-trocar-soil sm:text-5xl">
              Intercambiá sin dinero, entre vecinos.
            </h1>
            <p className="max-w-md text-base text-trocar-mute">
              La red de trueque moderna para nuestra ciudad. Cambiá lo que tenés
              por lo que necesitás.
            </p>
            <div className="flex flex-wrap gap-3">
              <TrocarButton
                href={primaryHref}
                className="rounded-full bg-trocar-leaf px-5 text-white hover:bg-trocar-leaf-deep"
              >
                Comenzar ahora
                <ArrowRight className="size-4" aria-hidden />
              </TrocarButton>
              <TrocarButton
                href="#como-funciona"
                variant="secondary"
                className="rounded-full border-0 bg-trocar-mist-deep text-trocar-soil hover:bg-white"
              >
                Ver cómo funciona
              </TrocarButton>
            </div>
          </div>

          <div className="trocar-fade-up relative overflow-hidden rounded-[2rem] bg-trocar-leaf min-h-64 lg:min-h-80">
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 20%, #c8f542 0%, transparent 45%), radial-gradient(circle at 80% 70%, #ffffff55 0%, transparent 40%)",
              }}
              aria-hidden
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-6">
              <p className="font-[family-name:var(--font-serif)] text-xl font-medium text-white">
                Vuelve el trueque, más simple que nunca.
              </p>
            </div>
          </div>
        </section>

        <section
          id="como-funciona"
          className="scroll-mt-8 bg-trocar-mist-deep py-14"
        >
          <div className="mx-auto w-full max-w-3xl space-y-8 px-5 sm:px-8">
            <h2 className="font-[family-name:var(--font-serif)] text-3xl font-semibold text-trocar-soil">
              ¿Cómo funciona?
            </h2>
            <ol className="space-y-6">
              {HOW_IT_WORKS.map((step) => (
                <li key={step.id} className="flex gap-4">
                  <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-trocar-leaf/10 text-trocar-leaf">
                    <step.Icon className="size-5" aria-hidden />
                  </span>
                  <div>
                    <h3 className="font-semibold text-trocar-soil">{step.title}</h3>
                    <p className="mt-1 text-sm text-trocar-mute">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="publicaciones" className="scroll-mt-8 py-14">
          <div className="mx-auto w-full max-w-3xl space-y-6 px-5 sm:px-8">
            <div className="flex items-end justify-between gap-4">
              <h2 className="font-[family-name:var(--font-serif)] text-3xl font-semibold text-trocar-soil">
                Lo último en la ciudad
              </h2>
              {isLoggedIn ? (
                <Link
                  href={ROUTES.feed}
                  className="text-sm font-semibold text-trocar-leaf hover:underline"
                >
                  Ver todo
                </Link>
              ) : (
                <Link
                  href={ROUTES.register}
                  className="text-sm font-semibold text-trocar-leaf hover:underline"
                >
                  Ver todo
                </Link>
              )}
            </div>

            {displayPosts.length === 0 ? (
              <p className="rounded-3xl bg-white px-5 py-8 text-sm text-trocar-mute ring-1 ring-black/5">
                Todavía no hay publicaciones activas. Sé la primera persona en{" "}
                <Link href={ROUTES.register} className="font-medium text-trocar-leaf">
                  crear una cuenta
                </Link>{" "}
                y publicar.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {displayPosts.map((post) => (
                  <LandingPostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>
        </section>

        <section id="preguntas" className="scroll-mt-8 bg-trocar-mist-deep py-14">
          <div className="mx-auto w-full max-w-3xl space-y-6 px-5 sm:px-8">
            <h2 className="font-[family-name:var(--font-serif)] text-3xl font-semibold text-trocar-soil">
              Preguntas frecuentes
            </h2>
            <LandingFaq />
          </div>
        </section>

        <section className="py-14">
          <div className="mx-auto w-full max-w-3xl space-y-6 px-5 sm:px-8">
            <div className="space-y-2">
              <h2 className="font-[family-name:var(--font-serif)] text-3xl font-semibold text-trocar-soil">
                ¿Dudas o sugerencias?
              </h2>
              <p className="text-sm text-trocar-mute">
                Escribinos y te responderemos en breve.
              </p>
            </div>
            <LandingContactForm />
          </div>
        </section>
      </main>

      <footer className="border-t border-black/5 py-10">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-5 sm:px-8">
          <p className="font-[family-name:var(--font-serif)] text-xl font-semibold text-trocar-leaf">
            {APP_NAME}
          </p>
          <p className="inline-flex items-center gap-1.5 text-sm text-trocar-mute">
            Hecho con <Heart className="size-3.5 fill-trocar-leaf text-trocar-leaf" aria-hidden />{" "}
            en Mar del Plata
          </p>
          <Link href={ROUTES.terms} className="text-sm text-trocar-mute hover:text-trocar-leaf">
            Términos y condiciones
          </Link>
        </div>
      </footer>
    </div>
  );
}
