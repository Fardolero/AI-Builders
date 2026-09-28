"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { TrocarButton } from "@/components/trocar/button";
import { TrocarInput } from "@/components/trocar/input";
import { PostCard, type PostCardData } from "@/components/trocar/post-card";
import { ROUTES } from "@/constants/routes";

type FeedClientProps = {
  posts: PostCardData[];
  barrio: string | null;
};

export function FeedClient({ posts, barrio }: FeedClientProps) {
  const [query, setQuery] = useState("");
  const [onlyMyBarrio, setOnlyMyBarrio] = useState(Boolean(barrio));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((post) => {
      if (onlyMyBarrio && barrio && post.barrio !== barrio) {
        return false;
      }
      if (!q) {
        return true;
      }
      return (
        post.title.toLowerCase().includes(q) ||
        post.description.toLowerCase().includes(q) ||
        post.looking_for.toLowerCase().includes(q)
      );
    });
  }, [posts, query, onlyMyBarrio, barrio]);

  return (
    <div className="trocar-fade-in space-y-5">
      <div className="flex flex-col gap-3">
        <TrocarInput
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar objetos o servicios…"
          className="sm:flex-1"
          aria-label="Buscar publicaciones"
        />
        <TrocarButton href={ROUTES.postsNew}>
          <Plus className="size-4" aria-hidden />
          Publicar
        </TrocarButton>
      </div>

      {barrio ? (
        <label className="inline-flex items-center gap-2 text-sm text-trocar-mute">
          <input
            type="checkbox"
            checked={onlyMyBarrio}
            onChange={(event) => setOnlyMyBarrio(event.target.checked)}
            className="size-4 accent-trocar-accent"
          />
          Solo {barrio}
        </label>
      ) : null}

      <section className="space-y-3">
        {filtered.length === 0 ? (
          <p className="trocar-card px-4 py-10 text-center text-trocar-mute">
            No hay publicaciones todavía. Sé la primera persona en publicar.
          </p>
        ) : (
          filtered.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </section>
    </div>
  );
}
