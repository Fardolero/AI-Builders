"use client";

import Link from "next/link";
import { useState } from "react";
import { ContactConfirmedBadge } from "@/components/trocar/contact-confirmed-badge";
import { InterestsEditor } from "@/components/trocar/interests-editor";
import { SignOutButton } from "@/components/trocar/sign-out-button";
import { PostGridCard } from "@/components/trocar/post-grid-card";
import { BadgeRow, type BadgeDef } from "@/lib/trocar/badges";
import { AvatarBadge, SegmentedTabs, StatPill } from "@/components/trocar/ui-bits";
import { ROUTES } from "@/constants/routes";

type OwnPost = {
  id: string;
  kind: "objeto" | "servicio";
  title: string;
  looking_for: string;
  barrio: string;
  status: string;
};

type Rating = {
  stars: number;
  comment: string | null;
  created_at: string;
  from_name: string | null;
};

export function ProfileClient({
  fullName,
  barrio,
  bio,
  avatarUrl,
  credits,
  exchanges,
  avgRating,
  topNeighbor,
  badges,
  posts,
  ratings,
  interests,
  emailConfirmed,
  phoneConfirmed,
  emptyReviewsLabel,
}: {
  fullName: string;
  barrio: string | null;
  bio: string | null;
  avatarUrl: string | null;
  credits: number;
  exchanges: number;
  avgRating: number | null;
  topNeighbor: boolean;
  badges: BadgeDef[];
  posts: OwnPost[];
  ratings: Rating[];
  interests: string[];
  emailConfirmed: boolean;
  phoneConfirmed: boolean;
  emptyReviewsLabel: string;
}) {
  const [tab, setTab] = useState<"posts" | "reviews" | "interests">("posts");

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <AvatarBadge
          name={fullName}
          avatarUrl={avatarUrl}
          size="lg"
          badge={topNeighbor ? "Top vecino" : null}
        />
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
            {fullName}
          </h1>
          <p className="text-sm text-trocar-mute">{barrio ?? "Sin barrio"}</p>
          <div className="mt-2 flex justify-center">
            <ContactConfirmedBadge
              emailConfirmed={emailConfirmed}
              phoneConfirmed={phoneConfirmed}
            />
          </div>
          {bio ? <p className="mt-2 text-sm text-trocar-paper">{bio}</p> : null}
        </div>
      </div>

      <div className="flex gap-2">
        <StatPill value={String(credits)} label="Créditos" />
        <StatPill value={String(exchanges)} label="Intercambios" />
        <StatPill
          value={avgRating !== null ? avgRating.toFixed(1) : "—"}
          label="Calificación"
        />
      </div>

      <BadgeRow badges={badges} />

      <SegmentedTabs
        value={tab}
        onChange={setTab}
        options={[
          { id: "posts", label: "Publicaciones" },
          { id: "reviews", label: "Reseñas" },
          { id: "interests", label: "Intereses" },
        ]}
      />

      {tab === "posts" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {posts.map((post) => (
            <PostGridCard
              key={post.id}
              post={{
                ...post,
                footer:
                  post.status === "intercambiada"
                    ? "Completado"
                    : post.status === "activa"
                      ? "Activa"
                      : "Pausada",
              }}
            />
          ))}
          <Link
            href={ROUTES.postsNew}
            className="flex min-h-40 flex-col items-center justify-center rounded-3xl border border-dashed border-trocar-line bg-white text-sm font-semibold text-trocar-accent"
          >
            + Nueva publicación
          </Link>
        </div>
      ) : tab === "reviews" ? (
        ratings.length === 0 ? (
          <p className="trocar-card px-4 py-8 text-center text-sm text-trocar-mute">
            {emptyReviewsLabel}
          </p>
        ) : (
          <ul className="space-y-3">
            {ratings.map((item, index) => (
              <li key={`${item.created_at}-${index}`} className="trocar-card p-4">
                <p className="text-sm font-semibold text-trocar-paper">
                  {item.from_name ?? "Vecino"} · {"★".repeat(item.stars)}
                </p>
                {item.comment ? (
                  <p className="mt-1 text-sm text-trocar-mute">{item.comment}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )
      ) : (
        <div className="trocar-card space-y-3 p-4">
          <p className="text-sm text-trocar-mute">
            Estos intereses alimentan Matches y tu lista de deseos.
          </p>
          <InterestsEditor initialInterests={interests} />
        </div>
      )}

      <div className="flex justify-center pt-2">
        <SignOutButton />
      </div>
    </div>
  );
}
