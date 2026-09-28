"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { Repeat2, X } from "lucide-react";
import { AvatarBadge } from "@/components/trocar/ui-bits";
import type { DashboardDTO } from "@/lib/matching/api";
import type { SugerenciaDTO } from "@/lib/matching/index";
import { cn } from "@/lib/cn";

export function MatchesClient({
  credits,
  avgRating,
  initial,
}: {
  credits: number;
  avgRating: number | null;
  initial: DashboardDTO;
}) {
  const [data, setData] = useState(initial);
  const [discarding, setDiscarding] = useState<string | null>(null);

  const descartar = useCallback(async (clave: string) => {
    setDiscarding(clave);
    try {
      const res = await fetch(
        `/api/matches/${encodeURIComponent(clave)}/descartar`,
        { method: "POST" },
      );
      if (res.ok) {
        setData((prev) => ({
          ...prev,
          matches: prev.matches.filter((m) => m.clave !== clave),
        }));
      }
    } finally {
      setDiscarding(null);
    }
  }, []);

  const alta = data.matches.filter((m) => m.confianza === "alta");
  const resto = data.matches.filter((m) => m.confianza !== "alta");

  const demandaBlock =
    data.demanda.length > 0 ? (
      <section className="space-y-3">
        <h2 className="text-xs font-semibold tracking-[0.16em] text-trocar-accent uppercase">
          Demanda en tu zona
        </h2>
        <ul className="space-y-3">
          {data.demanda.map((d) => (
            <li key={d.clave} className="trocar-card space-y-2 p-4">
              <p className="text-sm text-trocar-paper">{d.mensaje}</p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-trocar-sand px-2 py-0.5 text-xs text-trocar-ink">
                  {d.etiqueta}
                </span>
                <span className="text-xs text-trocar-mute">
                  {d.vecinosBuscando} vecinos
                </span>
                <Link
                  href={d.deepLink}
                  className="ml-auto text-sm font-semibold text-trocar-accent underline-offset-2 hover:underline"
                >
                  Publicar oferta
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </section>
    ) : null;

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-trocar-ink p-4 text-white">
        <p className="text-xs tracking-[0.16em] text-white/70 uppercase">
          Créditos vecinales
        </p>
        <div className="mt-1 flex items-end justify-between gap-3">
          <p className="font-[family-name:var(--font-display)] text-4xl font-bold">
            {credits}
          </p>
          <p className="text-sm text-trocar-mint">
            {avgRating !== null ? `${avgRating.toFixed(1)} · ` : ""}
            Reputación
          </p>
        </div>
        {data.actualizadoEn ? (
          <p className="mt-2 text-[11px] text-white/50">
            Matches actualizados{" "}
            {new Date(data.actualizadoEn).toLocaleString("es-AR", {
              dateStyle: "short",
              timeStyle: "short",
            })}
          </p>
        ) : null}
      </div>

      {data.demandaPrimero ? demandaBlock : null}

      {data.matches.length === 0 && data.demanda.length === 0 ? (
        <p className="trocar-card px-4 py-10 text-center text-sm text-trocar-mute">
          Todavía no hay coincidencias. Publicá qué buscás u ofrecés y volvé en
          unos minutos.
        </p>
      ) : (
        <>
          {alta.length > 0 ? (
            <MatchSection
              title="Alta coincidencia"
              items={alta}
              discarding={discarding}
              onDiscard={descartar}
            />
          ) : null}
          {resto.length > 0 ? (
            <MatchSection
              title="Sugerencias"
              items={resto}
              discarding={discarding}
              onDiscard={descartar}
            />
          ) : null}
        </>
      )}

      {!data.demandaPrimero ? demandaBlock : null}
    </div>
  );
}

function MatchSection({
  title,
  items,
  discarding,
  onDiscard,
}: {
  title: string;
  items: SugerenciaDTO[];
  discarding: string | null;
  onDiscard: (clave: string) => void;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold tracking-[0.16em] text-trocar-accent uppercase">
        {title}
      </h2>
      <ul className="space-y-3">
        {items.map((item) => {
          const nombre =
            item.intercambios.find((i) => i.entrega.nombre)?.entrega.nombre ??
            item.intercambios[0]?.entrega.nombre ??
            "Vecino";
          return (
            <li key={item.clave} className="trocar-card flex items-start gap-3 p-3">
              <div className="relative shrink-0">
                <AvatarBadge name={nombre} size="md" />
                <span
                  className={cn(
                    "absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full px-1.5 text-[10px] font-bold text-white",
                    item.confianza === "alta"
                      ? "bg-trocar-accent"
                      : "bg-trocar-ink",
                  )}
                >
                  {item.porcentaje}%
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-trocar-paper">{item.titular}</p>
                <p className="mt-0.5 text-xs text-trocar-mute">{item.distancia}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {item.motivos.map((m) => (
                    <span
                      key={m}
                      className="rounded-full border border-trocar-line bg-white px-2 py-0.5 text-[11px] text-trocar-mute"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-2">
                <Link
                  href={item.accion.href}
                  className="inline-flex size-10 items-center justify-center rounded-full bg-trocar-ink text-white"
                  aria-label={item.accion.etiqueta}
                >
                  <Repeat2 className="size-4" />
                </Link>
                <button
                  type="button"
                  disabled={discarding === item.clave}
                  onClick={() => onDiscard(item.clave)}
                  className="inline-flex size-10 items-center justify-center rounded-full border border-trocar-line text-trocar-mute hover:bg-trocar-sand disabled:opacity-50"
                  aria-label="Descartar sugerencia"
                >
                  <X className="size-4" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
