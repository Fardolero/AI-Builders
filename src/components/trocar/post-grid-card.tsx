import Link from "next/link";
import { Percent } from "lucide-react";
import { SavePostButton } from "@/components/trocar/save-post-button";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/cn";

export type PostGridCardData = {
  id: string;
  kind: "objeto" | "servicio";
  title: string;
  looking_for: string;
  barrio: string;
  status?: string;
  footer?: string;
  intent?: "ofrezco" | "busco" | null;
  image_url?: string | null;
};

export function PostGridCard({
  post,
  className,
  saved = false,
  showSave = false,
  href,
  matchScore,
}: {
  post: PostGridCardData;
  className?: string;
  saved?: boolean;
  showSave?: boolean;
  href?: string;
  matchScore?: number;
}) {
  const intentLabel =
    post.intent === "busco"
      ? "Busco"
      : post.intent === "ofrezco"
        ? "Ofrezco"
        : post.kind === "servicio"
          ? "Servicio"
          : "Artículo";

  return (
    <div className={cn("trocar-card relative overflow-hidden", className)}>
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
        {matchScore != null ? (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-white/95 px-1.5 py-0.5 text-[10px] font-bold text-trocar-ink shadow-sm">
            <Percent className="size-2.5" aria-hidden />
            {matchScore}
          </span>
        ) : null}
        {showSave ? (
          <SavePostButton postId={post.id} initiallySaved={saved} />
        ) : null}
      </div>
      <Link href={href ?? ROUTES.post(post.id)} className="block">
        {post.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.image_url}
            alt=""
            className="aspect-[4/3] w-full object-cover"
          />
        ) : (
          <div className="flex aspect-[4/3] items-end bg-gradient-to-br from-trocar-mist-deep to-trocar-paper-dim p-3">
            <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-trocar-accent uppercase">
              {intentLabel}
            </span>
          </div>
        )}
        <div className="space-y-1 p-3">
          {post.image_url ? (
            <span className="inline-flex rounded-full bg-trocar-mist-deep px-2 py-0.5 text-[10px] font-semibold tracking-wide text-trocar-accent uppercase">
              {intentLabel}
            </span>
          ) : null}
          <p className="line-clamp-1 text-sm font-semibold text-trocar-paper">
            {post.title}
          </p>
          <p className="line-clamp-1 text-xs text-trocar-accent">
            Busca: {post.looking_for}
          </p>
          <p className="text-xs text-trocar-mute">
            {post.footer ?? post.barrio}
          </p>
        </div>
      </Link>
    </div>
  );
}
