"use client";

import Link from "next/link";
import {
  Bell,
  Calendar,
  ChevronDown,
  Filter,
  MapPin,
  Package,
  Percent,
  Search,
  Wrench,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { ExploreHero } from "@/components/trocar/explore-hero";
import { ExploreMap } from "@/components/trocar/explore-map-lazy";
import { TrocarInput } from "@/components/trocar/input";
import { PostGridCard } from "@/components/trocar/post-grid-card";
import { AvatarBadge } from "@/components/trocar/ui-bits";
import { CATEGORY_FILTERS, PILOT_BARRIOS, ROUTES } from "@/constants/routes";
import { getTrocarIcon } from "@/lib/trocar/icons";
import {
  isMockPostId,
  meetingPointCounts,
  mockPostHref,
} from "@/lib/trocar/mock-posts";
import { scorePostMatch } from "@/lib/trocar/match-score";
import { cn } from "@/lib/cn";

export type FeedPost = {
  id: string;
  kind: "objeto" | "servicio";
  intent?: "ofrezco" | "busco" | null;
  title: string;
  description: string;
  looking_for: string;
  barrio: string;
  status: "activa" | "pausada" | "intercambiada" | "moderado";
  created_at: string;
  meetingPointId?: string | null;
  image_url?: string | null;
  category?: string | null;
  author?: { full_name: string | null } | null;
};

export type RecentMatchCard = {
  id: string;
  title: string;
  name: string;
  score: number;
  barrio: string;
  href: string;
  kind: "objeto" | "servicio";
};

type ExploreFeedProps = {
  posts: FeedPost[];
  recentMatches: RecentMatchCard[];
  barrio: string | null;
  displayName: string;
  lookingBag: string;
  savedPostIds?: string[];
};

type DateFilter = "all" | "7d" | "30d";
type MatchFilter = "all" | "70" | "85";
type KindFilter = "todos" | "objeto" | "servicio";
type IntentFilter = "todos" | "ofrezco" | "busco";
type ProximityFilter = "all" | "near";

export function ExploreFeed({
  posts,
  recentMatches,
  barrio,
  displayName,
  lookingBag,
  savedPostIds = [],
}: ExploreFeedProps) {
  const savedSet = useMemo(() => new Set(savedPostIds), [savedPostIds]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [matchFilter, setMatchFilter] = useState<MatchFilter>("all");
  const [kindFilter, setKindFilter] = useState<KindFilter>("todos");
  const [intentFilter, setIntentFilter] = useState<IntentFilter>("todos");
  const [proximityFilter, setProximityFilter] = useState<ProximityFilter>("all");
  const [meetingPointId, setMeetingPointId] = useState<string | null>(null);

  const scoredPosts = useMemo(() => {
    return posts.map((post) => ({
      ...post,
      matchScore: scorePostMatch(
        lookingBag,
        post.title,
        `${post.description} ${post.looking_for}`,
      ),
    }));
  }, [posts, lookingBag]);

  const pinCounts = useMemo(
    () => meetingPointCounts(scoredPosts),
    [scoredPosts],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const now = Date.now();

    return scoredPosts.filter((post) => {
      if (kindFilter !== "todos" && post.kind !== kindFilter) return false;
      if (
        intentFilter !== "todos" &&
        (post.intent ?? "ofrezco") !== intentFilter
      ) {
        return false;
      }

      if (proximityFilter === "near" && barrio) {
        const nearZone = PILOT_BARRIOS.includes(
          barrio as (typeof PILOT_BARRIOS)[number],
        )
          ? barrio
          : "Centro MdP";
        if (post.barrio !== nearZone) return false;
      }

      if (meetingPointId && post.meetingPointId !== meetingPointId) {
        return false;
      }

      if (matchFilter === "70" && post.matchScore < 70) return false;
      if (matchFilter === "85" && post.matchScore < 85) return false;

      if (dateFilter !== "all") {
        const created = new Date(post.created_at).getTime();
        const days = dateFilter === "7d" ? 7 : 30;
        if (now - created > days * 24 * 60 * 60 * 1000) return false;
      }

      if (category) {
        const filter = CATEGORY_FILTERS.find((item) => item.id === category);
        if (filter) {
          const haystack =
            `${post.title} ${post.description} ${post.looking_for}`.toLowerCase();
          if (!filter.keywords.some((keyword) => haystack.includes(keyword))) {
            return false;
          }
        }
      }

      if (!q) return true;
      return (
        post.title.toLowerCase().includes(q) ||
        post.description.toLowerCase().includes(q) ||
        post.looking_for.toLowerCase().includes(q) ||
        post.barrio.toLowerCase().includes(q) ||
        (post.author?.full_name ?? "").toLowerCase().includes(q)
      );
    });
  }, [
    scoredPosts,
    query,
    category,
    kindFilter,
    intentFilter,
    proximityFilter,
    barrio,
    meetingPointId,
    matchFilter,
    dateFilter,
  ]);

  const activeFilterCount = [
    dateFilter !== "all" ? dateFilter : null,
    matchFilter !== "all" ? matchFilter : null,
    kindFilter !== "todos" ? kindFilter : null,
    intentFilter !== "todos" ? intentFilter : null,
    proximityFilter !== "all" ? proximityFilter : null,
    meetingPointId,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setDateFilter("all");
    setMatchFilter("all");
    setKindFilter("todos");
    setIntentFilter("todos");
    setProximityFilter("all");
    setMeetingPointId(null);
    setCategory(null);
    setQuery("");
  };

  const firstName = displayName.split(" ")[0] ?? "vecino";

  return (
    <div className="trocar-fade-in mx-auto w-full max-w-5xl space-y-6 sm:space-y-8">
      <header className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <Link href={ROUTES.profile} className="flex min-w-0 items-center gap-3">
            <AvatarBadge name={displayName} size="md" />
            <div className="min-w-0">
              <p className="text-xs text-trocar-mute">Hola, {firstName}</p>
              <p className="truncate font-[family-name:var(--font-display)] text-lg font-bold text-trocar-paper sm:text-xl">
                {displayName}
              </p>
            </div>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={ROUTES.saved}
              className="hidden rounded-full bg-white px-3 py-2 text-xs font-semibold text-trocar-ink ring-1 ring-trocar-line sm:inline-flex"
            >
              Guardados
            </Link>
            <Link
              href={ROUTES.matches}
              className="hidden rounded-full bg-white px-3 py-2 text-xs font-semibold text-trocar-ink ring-1 ring-trocar-line sm:inline-flex"
            >
              Matches
            </Link>
            <Link
              href={ROUTES.notifications}
              className="relative inline-flex size-11 items-center justify-center rounded-full bg-white text-trocar-ink shadow-sm ring-1 ring-trocar-line"
              aria-label="Notificaciones"
            >
              <Bell className="size-5" aria-hidden />
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-trocar-mute"
              aria-hidden
            />
            <TrocarInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="¿Qué estás buscando?"
              aria-label="Buscar publicaciones"
              className="pl-10 pr-10"
            />
            {query ? (
              <button
                type="button"
                className="absolute top-1/2 right-3 -translate-y-1/2 text-trocar-mute"
                aria-label="Limpiar búsqueda"
                onClick={() => setQuery("")}
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((current) => !current)}
            className={cn(
              "inline-flex size-12 shrink-0 items-center justify-center rounded-2xl shadow-sm",
              showFilters || activeFilterCount > 0
                ? "bg-trocar-ink text-white"
                : "bg-white text-trocar-ink ring-1 ring-trocar-line",
            )}
            aria-expanded={showFilters}
            aria-label="Abrir filtros"
          >
            <Filter className="size-5" aria-hidden />
          </button>
        </div>

        <div className="flex gap-2 rounded-full bg-white p-1 shadow-sm ring-1 ring-trocar-line">
          {(
            [
              ["todos", "Todo"],
              ["ofrezco", "Ofrezco"],
              ["busco", "Busco"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setIntentFilter(value)}
              className={cn(
                "flex-1 rounded-full px-3 py-2 text-sm font-semibold transition-colors",
                intentFilter === value
                  ? "bg-trocar-ink text-white"
                  : "text-trocar-mute",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {showFilters ? (
          <div className="grid gap-3 rounded-3xl border border-trocar-line bg-white p-3 shadow-sm sm:grid-cols-2">
            <FilterRow
              label="Fecha"
              icon={Calendar}
              options={[
                { id: "all", label: "Todas" },
                { id: "7d", label: "7 días" },
                { id: "30d", label: "30 días" },
              ]}
              value={dateFilter}
              onChange={setDateFilter}
            />
            <FilterRow
              label="% Match"
              icon={Percent}
              options={[
                { id: "all", label: "Cualquiera" },
                { id: "70", label: "≥ 70%" },
                { id: "85", label: "≥ 85%" },
              ]}
              value={matchFilter}
              onChange={setMatchFilter}
            />
            <FilterRow
              label="Tipo"
              icon={Package}
              options={[
                { id: "todos", label: "Todos" },
                { id: "objeto", label: "Artículo" },
                { id: "servicio", label: "Servicio" },
              ]}
              value={kindFilter}
              onChange={setKindFilter}
            />
            <FilterRow
              label="Cercanía"
              icon={MapPin}
              options={[
                { id: "all", label: "Toda la zona" },
                { id: "near", label: barrio ? `Cerca (${barrio})` : "Mi zona" },
              ]}
              value={proximityFilter}
              onChange={setProximityFilter}
            />
            {activeFilterCount > 0 || query ? (
              <button
                type="button"
                onClick={clearFilters}
                className="text-left text-xs font-semibold text-trocar-accent sm:col-span-2"
              >
                Limpiar búsqueda y filtros
              </button>
            ) : null}
          </div>
        ) : null}
      </header>

      <ExploreHero firstName={firstName} />

      {recentMatches.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-bold sm:text-xl">
              Matches recientes
            </h2>
            <Link
              href={ROUTES.matches}
              className="text-xs font-semibold text-trocar-accent"
            >
              Ver todos
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recentMatches.slice(0, 6).map((match) => (
              <Link
                key={match.id}
                href={match.href}
                className="trocar-card space-y-2 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <AvatarBadge name={match.name} size="sm" />
                  <span className="rounded-full bg-trocar-ink px-2 py-0.5 text-[10px] font-bold text-white">
                    {match.score}%
                  </span>
                </div>
                <p className="line-clamp-2 text-sm font-semibold text-trocar-paper">
                  {match.title}
                </p>
                <p className="flex items-center gap-1 text-[11px] text-trocar-mute">
                  {match.kind === "servicio" ? (
                    <Wrench className="size-3" aria-hidden />
                  ) : (
                    <Package className="size-3" aria-hidden />
                  )}
                  {match.barrio}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-bold sm:text-xl">
          Categorías
        </h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory(null)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold",
              category === null
                ? "bg-trocar-ink text-white"
                : "border border-trocar-line bg-white text-trocar-paper",
            )}
          >
            {(() => {
              const Icon = getTrocarIcon("all");
              return <Icon className="size-3.5" aria-hidden />;
            })()}
            Todas
          </button>
          {CATEGORY_FILTERS.map((item) => {
            const Icon = getTrocarIcon(item.icon);
            const active = category === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  setCategory((current) =>
                    current === item.id ? null : item.id,
                  )
                }
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold",
                  active
                    ? "bg-trocar-ink text-white"
                    : "border border-trocar-line bg-white text-trocar-paper",
                )}
              >
                <Icon className="size-3.5" aria-hidden />
                {item.label}
              </button>
            );
          })}
        </div>
      </section>

      <ExploreMap
        counts={pinCounts}
        selectedPointId={meetingPointId}
        onSelectPoint={setMeetingPointId}
        userBarrio={barrio}
      />

      <div className="flex items-center justify-between gap-2">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-bold sm:text-xl">
          Publicaciones
        </h2>
        <p className="text-xs text-trocar-mute">
          {filtered.length}{" "}
          {filtered.length === 1 ? "resultado" : "resultados"}
        </p>
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 ? (
          <p className="trocar-card col-span-full px-4 py-10 text-center text-sm text-trocar-mute">
            No hay resultados con esos filtros. Probá otra búsqueda o limpiá los
            filtros.
          </p>
        ) : (
          filtered.map((post) => (
            <PostGridCard
              key={post.id}
              showSave={!isMockPostId(post.id)}
              saved={savedSet.has(post.id)}
              matchScore={post.matchScore}
              href={
                isMockPostId(post.id)
                  ? mockPostHref(post.id)
                  : ROUTES.post(post.id)
              }
              post={{
                ...post,
                footer: post.author?.full_name
                  ? `${post.author.full_name} · ${post.barrio}`
                  : post.barrio,
              }}
            />
          ))
        )}
      </section>
    </div>
  );
}

function FilterRow<T extends string>({
  label,
  icon: Icon,
  options,
  value,
  onChange,
}: {
  label: string;
  icon: typeof Calendar;
  options: { id: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-trocar-mute uppercase">
        <Icon className="size-3.5" aria-hidden />
        {label}
        <ChevronDown className="size-3 opacity-50" aria-hidden />
      </p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-semibold",
              value === option.id
                ? "bg-trocar-ink text-white"
                : "border border-trocar-line bg-trocar-mist text-trocar-paper",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
