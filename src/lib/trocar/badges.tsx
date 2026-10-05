import { Leaf, Lock, Medal, Zap } from "lucide-react";
import { cn } from "@/lib/cn";

export type BadgeDef = {
  id: string;
  label: string;
  earned: boolean;
  tone: "ink" | "mint" | "leaf" | "locked";
};

export function deriveBadges(input: {
  credits: number;
  exchanges: number;
  avgRating: number | null;
}): BadgeDef[] {
  return [
    {
      id: "confiable",
      label: "Vecino confiable",
      earned: input.credits >= 5 || input.exchanges >= 1,
      tone: "ink",
    },
    {
      id: "rapida",
      label: "Respuesta rápida",
      earned: (input.avgRating ?? 0) >= 4.5,
      tone: "mint",
    },
    {
      id: "eco",
      label: "Eco vecino",
      earned: input.exchanges >= 3,
      tone: "leaf",
    },
    {
      id: "proxima",
      label: "Próxima",
      earned: false,
      tone: "locked",
    },
  ];
}

export function isTopNeighbor(credits: number) {
  return credits >= 20;
}

export function BadgeRow({ badges }: { badges: BadgeDef[] }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold tracking-[0.16em] text-trocar-accent uppercase">
        Insignias
      </p>
      <div className="flex flex-wrap gap-3">
        {badges.map((badge) => {
          const Icon =
            badge.id === "rapida"
              ? Zap
              : badge.id === "eco"
                ? Leaf
                : badge.id === "proxima"
                  ? Lock
                  : Medal;
          return (
            <div key={badge.id} className="flex w-16 flex-col items-center gap-1">
              <div
                className={cn(
                  "inline-flex size-12 items-center justify-center rounded-full",
                  badge.tone === "ink" && "bg-trocar-ink text-white",
                  badge.tone === "mint" && "bg-trocar-mint text-trocar-ink",
                  badge.tone === "leaf" && "bg-trocar-leaf text-white",
                  badge.tone === "locked" && "bg-trocar-mist-deep text-trocar-mute",
                  !badge.earned && badge.tone !== "locked" && "opacity-40",
                )}
              >
                <Icon className="size-5" aria-hidden />
              </div>
              <p className="text-center text-[10px] leading-tight text-trocar-mute">
                {badge.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
