"use client";

import { useState } from "react";
import { InterestsEditor } from "@/components/trocar/interests-editor";
import { PostGridCard } from "@/components/trocar/post-grid-card";
import { SegmentedTabs } from "@/components/trocar/ui-bits";

type SavedPost = {
  id: string;
  kind: "objeto" | "servicio";
  title: string;
  looking_for: string;
  barrio: string;
};

export function SavedClient({
  posts,
  interests,
}: {
  posts: SavedPost[];
  interests: string[];
}) {
  const [tab, setTab] = useState<"saved" | "wishlist">("saved");

  return (
    <div className="space-y-5">
      <SegmentedTabs
        value={tab}
        onChange={setTab}
        options={[
          { id: "saved", label: "Guardados" },
          { id: "wishlist", label: "Lista de deseos" },
        ]}
      />

      {tab === "saved" ? (
        posts.length === 0 ? (
          <p className="trocar-card px-4 py-10 text-center text-sm text-trocar-mute">
            Todavía no guardaste publicaciones. Explorá el feed y tocá el bookmark.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostGridCard key={post.id} post={post} />
            ))}
          </div>
        )
      ) : (
        <div className="space-y-4">
          <div className="trocar-card space-y-3 p-5">
            <p className="font-semibold text-trocar-paper">
              Tu lista de deseos
            </p>
            <p className="text-sm text-trocar-mute">
              Elegí hasta 8 intereses. Te avisamos cuando aparezca un match
              (notificaciones reales en una próxima tanda).
            </p>
            <InterestsEditor initialInterests={interests} />
          </div>
        </div>
      )}
    </div>
  );
}
