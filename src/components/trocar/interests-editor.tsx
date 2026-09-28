"use client";

import { useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";
import { updateInterestsAction } from "@/app/actions/profile";
import { INTEREST_OPTIONS, type InterestOption } from "@/constants/routes";
import { cn } from "@/lib/cn";

export function InterestsEditor({
  initialInterests,
}: {
  initialInterests: string[];
}) {
  const [selected, setSelected] = useState<InterestOption[]>(
    initialInterests.filter((item): item is InterestOption =>
      INTEREST_OPTIONS.includes(item as InterestOption),
    ),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const toggle = (interest: InterestOption) => {
    setSelected((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : [...current, interest].slice(0, 8),
    );
    setMessage(null);
    setError(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {INTEREST_OPTIONS.map((interest) => {
          const active = selected.includes(interest);
          return (
            <button
              key={interest}
              type="button"
              disabled={pending}
              onClick={() => toggle(interest)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm",
                active
                  ? "border-trocar-ink bg-trocar-ink text-white"
                  : "border-trocar-line bg-white text-trocar-paper",
              )}
            >
              {interest}
            </button>
          );
        })}
      </div>
      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {message ? <p className="text-sm text-trocar-accent">{message}</p> : null}
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            const result = await updateInterestsAction(selected);
            if (result.error) {
              setError(result.error);
              return;
            }
            setMessage("Intereses guardados.");
          });
        }}
        className="inline-flex items-center gap-2 rounded-full bg-trocar-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? (
          <>
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
            Guardando…
          </>
        ) : (
          "Guardar intereses"
        )}
      </button>
    </div>
  );
}
