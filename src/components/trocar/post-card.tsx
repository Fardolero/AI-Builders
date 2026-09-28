import Link from "next/link";
import { ROUTES } from "@/constants/routes";

export type PostCardData = {
  id: string;
  kind: "objeto" | "servicio";
  title: string;
  description: string;
  looking_for: string;
  barrio: string;
  status: "activa" | "pausada" | "intercambiada";
  created_at: string;
  author?: {
    full_name: string | null;
  } | null;
};

export function PostCard({ post }: { post: PostCardData }) {
  return (
    <Link href={ROUTES.post(post.id)} className="trocar-card group block p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-trocar-paper">{post.title}</p>
        <span className="rounded-full bg-trocar-mist-deep px-2 py-0.5 text-[10px] font-semibold tracking-wide text-trocar-accent uppercase">
          {post.kind}
        </span>
      </div>
      <p className="mt-1 line-clamp-2 text-sm text-trocar-mute">{post.description}</p>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-trocar-mist-deep">
        <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-[#d6f36b] to-trocar-mint" />
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-trocar-mute">
        <span className="truncate">Busca: {post.looking_for}</span>
        <span className="shrink-0">{post.barrio}</span>
      </div>
      {post.author?.full_name ? (
        <p className="mt-2 text-xs text-trocar-mute">{post.author.full_name}</p>
      ) : null}
    </Link>
  );
}
