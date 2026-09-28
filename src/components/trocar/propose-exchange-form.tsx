"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useForm } from "react-hook-form";
import { proposeExchangeAction } from "@/app/actions/exchanges";
import { TrocarButton } from "@/components/trocar/button";
import { TrocarTextarea } from "@/components/trocar/input";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/cn";
import {
  proposeExchangeSchema,
  type ProposeExchangeValues,
} from "@/lib/validations/exchange";

type OwnPost = {
  id: string;
  title: string;
  looking_for: string;
};

type ProposeFormProps = {
  postId: string;
  postTitle: string;
  ownPosts: OwnPost[];
};

export function ProposeExchangeForm({
  postId,
  postTitle,
  ownPosts,
}: ProposeFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting, isValid },
  } = useForm<ProposeExchangeValues>({
    resolver: zodResolver(proposeExchangeSchema),
    mode: "onChange",
    defaultValues: {
      postId,
      offerText: "",
      offerPostId: ownPosts[0]?.id ?? null,
    },
  });

  const offerText = watch("offerText") ?? "";
  const offerPostId = watch("offerPostId");

  if (ownPosts.length === 0) {
    return (
      <div className="trocar-card space-y-4 p-5">
        <p className="text-sm text-trocar-mute">
          Para proponer un intercambio necesitás tener al menos una publicación
          activa.
        </p>
        <TrocarButton href={ROUTES.postsNew}>Publicar algo mío</TrocarButton>
      </div>
    );
  }

  const onValidSubmit = async (data: ProposeExchangeValues) => {
    setSubmitError(null);
    const result = await proposeExchangeAction(data);
    if (result?.error) {
      setSubmitError(result.error);
    }
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleSubmit(onValidSubmit)(event);
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <p className="text-sm text-trocar-mute">
        Estás proponiendo un intercambio por{" "}
        <span className="text-trocar-paper">{postTitle}</span>.
      </p>
      {submitError ? (
        <p
          role="alert"
          className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-700"
        >
          {submitError}
        </p>
      ) : null}

      <div className="space-y-2">
        <p className="text-sm font-medium text-trocar-paper">
          ¿Qué ofrecés vos?
        </p>
        <ul className="space-y-2">
          {ownPosts.map((post) => (
            <li key={post.id}>
              <button
                type="button"
                onClick={() =>
                  setValue("offerPostId", post.id, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
                className={cn(
                  "w-full rounded-2xl border px-3 py-3 text-left text-sm transition-colors",
                  offerPostId === post.id
                    ? "border-trocar-ink bg-trocar-ink text-white"
                    : "border-trocar-line bg-white text-trocar-paper",
                )}
              >
                <span className="font-semibold">{post.title}</span>
                {post.looking_for ? (
                  <span className="mt-0.5 block text-xs opacity-80">
                    Busca: {post.looking_for}
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
        <Link
          href={ROUTES.postsNew}
          className="inline-block text-sm font-medium text-trocar-accent underline-offset-2 hover:underline"
        >
          + Ofrecer algo nuevo
        </Link>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="offerText"
          className="text-sm font-medium text-trocar-paper"
        >
          Mensaje (opcional detalle)
        </label>
        <TrocarTextarea
          id="offerText"
          placeholder="Ej: Hola! Te propongo cambiar por mi taladro, ¿te sirve?"
          invalid={Boolean(errors.offerText)}
          disabled={isSubmitting}
          {...register("offerText")}
        />
        {errors.offerText?.message ? (
          <p role="alert" className="text-sm text-red-600">
            {errors.offerText.message}
          </p>
        ) : null}
      </div>
      <input type="hidden" {...register("postId")} />
      <input type="hidden" {...register("offerPostId")} />
      <p className="text-xs text-trocar-mute">
        Vas a coordinar los detalles en el chat.
      </p>
      <div className="flex flex-wrap gap-3">
        <TrocarButton href={ROUTES.post(postId)} variant="secondary">
          Cancelar
        </TrocarButton>
        <TrocarButton
          type="submit"
          disabled={!isValid || offerText.trim().length < 5 || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
              Enviando…
            </>
          ) : (
            "Enviar propuesta"
          )}
        </TrocarButton>
      </div>
    </form>
  );
}
