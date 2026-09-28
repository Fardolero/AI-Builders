"use client";

import dynamic from "next/dynamic";

export const ExploreMap = dynamic(
  () =>
    import("@/components/trocar/explore-map").then((mod) => mod.ExploreMap),
  {
    ssr: false,
    loading: () => (
      <section className="space-y-3">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">
            Puntos de encuentro
          </h2>
          <p className="text-sm text-trocar-mute">Cargando mapa…</p>
        </div>
        <div className="trocar-card h-56 animate-pulse bg-trocar-mist-deep sm:h-72" />
      </section>
    ),
  },
);
