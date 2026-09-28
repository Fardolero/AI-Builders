"use client";

import { Bookmark } from "lucide-react";
import { useState, useTransition } from "react";
import { savePostAction, unsavePostAction } from "@/app/actions/saved";
import { cn } from "@/lib/cn";

export function SavePostButton({
  postId,
  initiallySaved,
}: {
  postId: string;
  initiallySaved: boolean;
}) {
  const [saved, setSaved] = useState(initiallySaved);
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      aria-pressed={saved}
      aria-label={saved ? "Quitar de guardados" : "Guardar"}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-full bg-white shadow-sm",
        saved ? "text-trocar-accent" : "text-trocar-mute",
      )}
      onClick={() => {
        startTransition(async () => {
          const result = saved
            ? await unsavePostAction(postId)
            : await savePostAction(postId);
          if (!result.error) {
            setSaved(!saved);
          }
        });
      }}
    >
      <Bookmark className={cn("size-4", saved && "fill-current")} aria-hidden />
    </button>
  );
}
