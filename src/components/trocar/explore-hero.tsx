"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

const BANNERS = [
  {
    id: "feria",
    eyebrow: "Novedad",
    title: "Feria de trueque en Plaza Mitre",
    body: "Sábado 14 de Octubre · 14 a 18hs. Traé lo que ya no usás.",
  },
  {
    id: "ruta",
    eyebrow: "Corredor costero",
    title: "Nuevos puntos MdP → Miramar",
    body: "Chapadmalal, Santa Clara y Miramar ya tienen puntos de encuentro.",
  },
  {
    id: "creditos",
    eyebrow: "Comunidad",
    title: "Sumá Créditos Vecinales",
    body: "Cada intercambio confirmado mejora tu reputación en el barrio.",
  },
] as const;

export function ExploreHero({ firstName }: { firstName?: string }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % BANNERS.length);
    }, 5500);
    return () => window.clearInterval(timer);
  }, []);

  const banner = BANNERS[index]!;

  return (
    <section className="relative overflow-hidden rounded-3xl bg-trocar-ink text-white shadow-[0_20px_50px_-30px_rgba(14,58,44,0.8)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(circle at 85% 20%, rgba(167,214,196,0.55), transparent 45%), linear-gradient(135deg, rgba(61,122,94,0.35), transparent 55%)",
        }}
      />
      <div className="relative flex min-h-[9.5rem] flex-col justify-between gap-4 p-5 sm:min-h-[11rem] sm:p-6 md:min-h-[12rem]">
        <div className="max-w-xl space-y-2">
          <p className="text-[10px] font-semibold tracking-[0.18em] text-trocar-mint uppercase">
            {banner.eyebrow}
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold leading-tight sm:text-3xl">
            {banner.title}
          </h2>
          <p className="text-sm text-white/75 sm:text-base">
            {banner.body}
            {firstName && index === 0 ? ` Te esperamos, ${firstName}.` : ""}
          </p>
        </div>

        <div className="flex items-center gap-2" role="tablist" aria-label="Banners">
          {BANNERS.map((item, bannerIndex) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={bannerIndex === index}
              aria-label={`Banner ${bannerIndex + 1}: ${item.title}`}
              onClick={() => setIndex(bannerIndex)}
              className={cn(
                "h-2 rounded-full transition-all",
                bannerIndex === index
                  ? "w-6 bg-trocar-mint"
                  : "w-2 bg-white/35 hover:bg-white/55",
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
