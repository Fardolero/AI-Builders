"use client";

import Link from "next/link";
import { Package, Search, Wrench } from "lucide-react";
import { useMemo, useState } from "react";
import { AvatarBadge, SegmentedTabs } from "@/components/trocar/ui-bits";
import { TrocarInput } from "@/components/trocar/input";
import { ROUTES } from "@/constants/routes";
import { exchangeStatusLabel } from "@/lib/trocar/exchange-status";
import { cn } from "@/lib/cn";

export type ExchangeListItem = {
  id: string;
  status: string;
  offerText: string;
  updatedAt: string;
  postTitle: string;
  postKind: "objeto" | "servicio" | null;
  postIntent: "ofrezco" | "busco" | null;
  counterpartName: string;
  counterpartAvatar: string | null;
};

type TabId = "pendientes" | "concretados" | "rechazados";

function tabForStatus(status: string): TabId {
  if (status === "completed") return "concretados";
  if (status === "rejected" || status === "cancelled") return "rechazados";
  return "pendientes";
}

function formatExchangeDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function ExchangesClient({ items }: { items: ExchangeListItem[] }) {
  const [tab, setTab] = useState<TabId>("pendientes");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const next = { pendientes: 0, concretados: 0, rechazados: 0 };
    for (const item of items) {
      next[tabForStatus(item.status)] += 1;
    }
    return next;
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (tabForStatus(item.status) !== tab) return false;
      if (!q) return true;
      return (
        item.postTitle.toLowerCase().includes(q) ||
        item.offerText.toLowerCase().includes(q) ||
        item.counterpartName.toLowerCase().includes(q) ||
        exchangeStatusLabel(item.status).toLowerCase().includes(q)
      );
    });
  }, [items, tab, query]);

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-trocar-mute"
          aria-hidden
        />
        <TrocarInput
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por vecino, publicación…"
          aria-label="Buscar mensajes"
          className="pl-10"
        />
      </div>

      <SegmentedTabs
        value={tab}
        onChange={setTab}
        options={[
          { id: "pendientes", label: `Pendientes (${counts.pendientes})` },
          { id: "concretados", label: `Concretados (${counts.concretados})` },
          { id: "rechazados", label: `Rechazados (${counts.rechazados})` },
        ]}
      />

      {!items.length ? (
        <p className="text-trocar-mute">
          Todavía no tenés propuestas. Explorá el{" "}
          <Link href={ROUTES.feed} className="text-trocar-accent">
            feed
          </Link>
          .
        </p>
      ) : !filtered.length ? (
        <p className="rounded-2xl border border-dashed border-trocar-line bg-white px-4 py-8 text-center text-sm text-trocar-mute">
          {query.trim()
            ? "No hay resultados para esa búsqueda."
            : `No hay chats ${tab}.`}
        </p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((item) => {
            const KindIcon = item.postKind === "servicio" ? Wrench : Package;
            const kindLabel =
              item.postKind === "servicio" ? "Servicio" : "Objeto";
            const intentLabel =
              item.postIntent === "busco"
                ? "Busco"
                : item.postIntent === "ofrezco"
                  ? "Ofrezco"
                  : null;

            return (
              <li key={item.id}>
                <Link
                  href={ROUTES.exchange(item.id)}
                  className="trocar-card flex gap-3 p-4 transition-transform hover:-translate-y-0.5"
                >
                  <AvatarBadge
                    name={item.counterpartName}
                    avatarUrl={item.counterpartAvatar}
                    size="md"
                  />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate font-semibold text-trocar-paper">
                        {item.counterpartName}
                      </p>
                      <time
                        dateTime={item.updatedAt}
                        className="shrink-0 text-[11px] text-trocar-mute"
                      >
                        {formatExchangeDate(item.updatedAt)}
                      </time>
                    </div>
                    <p className="truncate text-sm text-trocar-paper">
                      {item.postTitle}
                    </p>
                    <p className="line-clamp-1 text-sm text-trocar-mute">
                      {item.offerText}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-trocar-mist-deep px-2 py-0.5 text-[10px] font-semibold text-trocar-accent uppercase">
                        <KindIcon className="size-3" aria-hidden />
                        {kindLabel}
                        {intentLabel ? ` · ${intentLabel}` : ""}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
                          item.status === "completed"
                            ? "bg-trocar-mint/30 text-trocar-ink"
                            : item.status === "rejected" ||
                                item.status === "cancelled"
                              ? "bg-red-50 text-red-700"
                              : "bg-white text-trocar-mute ring-1 ring-trocar-line",
                        )}
                      >
                        {exchangeStatusLabel(item.status)}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
