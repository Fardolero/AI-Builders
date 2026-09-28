"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useState, useTransition, type FormEvent } from "react";
import { useForm } from "react-hook-form";
import { updatePostAction, updatePostStatusAction } from "@/app/actions/posts";
import { TrocarButton } from "@/components/trocar/button";
import { TrocarInput, TrocarTextarea } from "@/components/trocar/input";
import { PILOT_BARRIOS, MEETING_POINTS } from "@/constants/routes";
import { MeetingPointPicker } from "@/components/trocar/meeting-point-picker";
import {
  CREATE_POST_DEFAULT_VALUES,
  createPostSchema,
  type CreatePostFormValues,
} from "@/lib/validations/post-trocar";
import { cn } from "@/lib/cn";

type OwnerActionsProps = {
  postId: string;
  status: "activa" | "pausada" | "intercambiada" | "moderado";
  kind: "objeto" | "servicio";
  title: string;
  description: string;
  lookingFor: string;
  barrio: string;
  meetingPointId?: string | null;
};

export function PostOwnerActions({
  postId,
  status,
  kind,
  title,
  description,
  lookingFor,
  barrio,
  meetingPointId,
}: OwnerActionsProps) {
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const run = (next: "activa" | "pausada" | "intercambiada") => {
    setError(null);
    startTransition(async () => {
      const result = await updatePostStatusAction({ id: postId, status: next });
      if (result.error) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="trocar-card space-y-3 p-4">
      <p className="text-sm font-medium text-trocar-paper">Tu publicación</p>
      <p className="text-xs text-trocar-mute">Estado actual: {status}</p>
      {status === "moderado" ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          En moderación: revisá el contenido (categorías prohibidas) y editá para
          republicar.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {status !== "intercambiada" ? (
          <TrocarButton
            type="button"
            variant="secondary"
            disabled={isPending}
            onClick={() => setEditing((value) => !value)}
          >
            {editing ? "Cerrar edición" : "Editar"}
          </TrocarButton>
        ) : null}
        {(status === "pausada" || status === "moderado") && (
          <TrocarButton
            type="button"
            variant="secondary"
            disabled={isPending}
            onClick={() => run("activa")}
          >
            Reactivar
          </TrocarButton>
        )}
        {status === "activa" ? (
          <TrocarButton
            type="button"
            variant="secondary"
            disabled={isPending}
            onClick={() => run("pausada")}
          >
            Pausar
          </TrocarButton>
        ) : null}
        {status !== "intercambiada" ? (
          <TrocarButton
            type="button"
            disabled={isPending}
            onClick={() => run("intercambiada")}
          >
            Marcar intercambiada
          </TrocarButton>
        ) : null}
      </div>
      {editing ? (
        <EditPostForm
          postId={postId}
          defaults={{
            ...CREATE_POST_DEFAULT_VALUES,
            kind,
            title,
            description,
            lookingFor,
            barrio: PILOT_BARRIOS.includes(barrio as (typeof PILOT_BARRIOS)[number])
              ? (barrio as (typeof PILOT_BARRIOS)[number])
              : PILOT_BARRIOS[0],
            meetingPointId:
              meetingPointId &&
              MEETING_POINTS.some((point) => point.id === meetingPointId)
                ? (meetingPointId as (typeof MEETING_POINTS)[number]["id"])
                : null,
          }}
          onSaved={() => setEditing(false)}
        />
      ) : null}
    </div>
  );
}

function EditPostForm({
  postId,
  defaults,
  onSaved,
}: {
  postId: string;
  defaults: CreatePostFormValues;
  onSaved: () => void;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreatePostFormValues>({
    resolver: zodResolver(createPostSchema),
    defaultValues: defaults,
  });
  const kind = watch("kind");
  const barrio = watch("barrio");
  const meetingPointId = watch("meetingPointId");

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleSubmit(async (data) => {
      setSubmitError(null);
      const result = await updatePostAction({ ...data, id: postId });
      if (result.error) {
        setSubmitError(result.error);
        return;
      }
      onSaved();
    })(event);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3 border-t border-trocar-line pt-3">
      {submitError ? (
        <p role="alert" className="text-sm text-red-700">
          {submitError}
        </p>
      ) : null}
      <div className="flex gap-2">
        {(["objeto", "servicio"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setValue("kind", option, { shouldValidate: true })}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm capitalize",
              kind === option
                ? "border-trocar-ink bg-trocar-ink text-white"
                : "border-trocar-line text-trocar-paper",
            )}
          >
            {option}
          </button>
        ))}
      </div>
      <TrocarInput {...register("title")} placeholder="Título" />
      {errors.title?.message ? (
        <p className="text-sm text-red-700">{errors.title.message}</p>
      ) : null}
      <TrocarTextarea {...register("description")} placeholder="Descripción" />
      <TrocarInput {...register("lookingFor")} placeholder="Qué buscás a cambio" />
      <label className="block text-sm text-trocar-mute">
        Barrio
        <select
          className="mt-1 w-full rounded-2xl border border-trocar-line bg-white px-4 py-3 text-sm text-trocar-paper"
          {...register("barrio")}
        >
          {PILOT_BARRIOS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <MeetingPointPicker
        value={meetingPointId}
        barrio={barrio}
        disabled={isSubmitting}
        onChange={(id) =>
          setValue("meetingPointId", id, {
            shouldValidate: true,
            shouldDirty: true,
          })
        }
      />
      <TrocarButton type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
            Guardando…
          </>
        ) : (
          "Guardar cambios"
        )}
      </TrocarButton>
    </form>
  );
}
