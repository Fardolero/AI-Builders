"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Star } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { useForm } from "react-hook-form";
import { submitRatingAction } from "@/app/actions/exchanges";
import { TrocarButton } from "@/components/trocar/button";
import { TrocarTextarea } from "@/components/trocar/input";
import {
  ratingSchema,
  type RatingFormValues,
} from "@/lib/validations/exchange";
import { cn } from "@/lib/cn";

const QUICK_CHIPS = [
  "Puntual",
  "Buena onda",
  "Tal cual lo describió",
] as const;

type RatingFormProps = {
  exchangeId: string;
  counterpartName: string;
};

export function RatingForm({ exchangeId, counterpartName }: RatingFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [chips, setChips] = useState<string[]>([]);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useForm<RatingFormValues>({
    resolver: zodResolver(ratingSchema),
    defaultValues: { exchangeId, stars: 5, comment: "" },
  });

  const stars = watch("stars");
  const comment = watch("comment") ?? "";

  const composedComment = useMemo(() => {
    const chipPart = chips.length > 0 ? chips.join(" · ") : "";
    if (chipPart && comment.trim()) return `${chipPart}. ${comment.trim()}`;
    return chipPart || comment.trim();
  }, [chips, comment]);

  const toggleChip = (chip: string) => {
    setChips((current) =>
      current.includes(chip)
        ? current.filter((item) => item !== chip)
        : [...current, chip],
    );
  };

  const onValidSubmit = async (data: RatingFormValues) => {
    setSubmitError(null);
    const result = await submitRatingAction({
      ...data,
      comment: composedComment.slice(0, 280),
    });
    if (result?.error) {
      setSubmitError(result.error);
    }
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleSubmit(onValidSubmit)(event);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <p className="text-sm text-trocar-mute">
        ¿Cómo fue tu trueque con{" "}
        <span className="text-trocar-paper">{counterpartName}</span>?
      </p>
      {submitError ? (
        <p role="alert" className="text-sm text-red-600">
          {submitError}
        </p>
      ) : null}
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setValue("stars", value, { shouldValidate: true })}
            className="p-1"
            aria-label={`${value} estrellas`}
          >
            <Star
              className={cn(
                "size-7",
                value <= stars
                  ? "fill-trocar-accent text-trocar-accent"
                  : "text-trocar-mute",
              )}
            />
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {QUICK_CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => toggleChip(chip)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm",
              chips.includes(chip)
                ? "border-trocar-ink bg-trocar-ink text-white"
                : "border-trocar-line bg-white text-trocar-paper",
            )}
          >
            {chip}
          </button>
        ))}
      </div>
      <input type="hidden" {...register("exchangeId")} />
      <input type="hidden" {...register("stars", { valueAsNumber: true })} />
      <TrocarTextarea
        placeholder="Comentario opcional (máx. 200)"
        disabled={isSubmitting}
        maxLength={200}
        {...register("comment")}
      />
      <p className="text-xs text-trocar-mute">
        Vas a ver su calificación cuando vos también califiques, o en 7 días.
      </p>
      <TrocarButton type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
            Guardando…
          </>
        ) : (
          "Enviar calificación"
        )}
      </TrocarButton>
    </form>
  );
}
