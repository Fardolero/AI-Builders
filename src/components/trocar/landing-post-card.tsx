import Link from "next/link";
import { ArrowLeftRight } from "lucide-react";
import type { PostCardData } from "@/components/trocar/post-card";
import { ROUTES } from "@/constants/routes";
import { isMockPostId } from "@/lib/trocar/mock-posts";

export function LandingPostCard({ post }: { post: PostCardData }) {
  const href = isMockPostId(post.id)
    ? `/posts/demo/${post.id}`
    : ROUTES.post(post.id);

  return (
    <Link
      href={href}
      className="group flex w-full flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5 transition-transform duration-200 hover:-translate-y-0.5"
    >
      <div className="relative flex h-40 items-end bg-gradient-to-br from-trocar-mist-deep to-trocar-leaf/30 p-4">
        <span className="absolute top-3 right-3 inline-flex size-8 items-center justify-center rounded-full bg-white/90 text-trocar-leaf shadow-sm">
          <ArrowLeftRight className="size-4" aria-hidden />
        </span>
        <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-trocar-leaf uppercase">
          Trueque
        </span>
      </div>
      <div className="space-y-1.5 p-4">
        <p className="text-xs text-trocar-mute capitalize">
          {post.kind} · {post.barrio}
        </p>
        <h3 className="font-[family-name:var(--font-serif)] text-lg font-semibold text-trocar-soil group-hover:text-trocar-leaf">
          {post.title}
        </h3>
        <p className="line-clamp-2 text-sm text-trocar-mute">
          Busco: {post.looking_for}
        </p>
      </div>
    </Link>
  );
}
