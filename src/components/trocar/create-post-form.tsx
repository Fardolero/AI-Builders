"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, ImagePlus } from "lucide-react";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { useForm } from "react-hook-form";
import { createPostAction } from "@/app/actions/posts";
import { TrocarButton } from "@/components/trocar/button";
import { TrocarInput, TrocarTextarea } from "@/components/trocar/input";
import { MeetingPointPicker } from "@/components/trocar/meeting-point-picker";
import { PILOT_BARRIOS, ROUTES } from "@/constants/routes";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/cn";
import {
  CREATE_POST_DEFAULT_VALUES,
  POST_CATEGORIES,
  PROHIBITED_KEYWORDS,
  createPostSchema,
  type CreatePostFormValues,
} from "@/lib/validations/post-trocar";

type CreatePostFormProps = {
  defaultBarrio?: string | null;
};

export function CreatePostForm({ defaultBarrio }: CreatePostFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [showProhibited, setShowProhibited] = useState(false);

  const initialBarrio = PILOT_BARRIOS.includes(
    defaultBarrio as (typeof PILOT_BARRIOS)[number],
  )
    ? (defaultBarrio as (typeof PILOT_BARRIOS)[number])
    : CREATE_POST_DEFAULT_VALUES.barrio;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting, isValid },
  } = useForm<CreatePostFormValues>({
    resolver: zodResolver(createPostSchema),
    mode: "onChange",
    defaultValues: {
      ...CREATE_POST_DEFAULT_VALUES,
      barrio: initialBarrio,
    },
  });

  const intent = watch("intent");
  const kind = watch("kind");
  const condition = watch("condition");
  const barrio = watch("barrio");
  const meetingPointId = watch("meetingPointId");
  const imageUrl = watch("imageUrl");
  const values = watch();
  const hasRequired =
    values.title.trim().length > 0 && values.description.trim().length > 0;

  const onPickImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setSubmitError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setSubmitError("Tenés que iniciar sesión para subir fotos.");
        return;
      }
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("post-images")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (error) {
        setSubmitError(error.message);
        return;
      }
      const { data } = supabase.storage.from("post-images").getPublicUrl(path);
      setValue("imageUrl", data.publicUrl, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setPreview(data.publicUrl);
    } finally {
      setUploading(false);
    }
  };

  const onValidSubmit = async (data: CreatePostFormValues): Promise<void> => {
    setSubmitError(null);
    const result = await createPostAction(data);
    if (result?.error) {
      setSubmitError(result.error);
    }
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    void handleSubmit(onValidSubmit)(event);
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {submitError ? (
        <p
          role="alert"
          className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-700"
        >
          {submitError}
        </p>
      ) : null}

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-trocar-paper">
          Tipo de publicación
        </legend>
        <div className="flex gap-2">
          {(
            [
              ["ofrezco", "Ofrezco"],
              ["busco", "Busco"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() =>
                setValue("intent", value, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm transition-colors",
                intent === value
                  ? "border-trocar-ink bg-trocar-ink text-white"
                  : "border-trocar-line text-trocar-paper hover:border-trocar-mute",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <input type="hidden" {...register("intent")} />
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-trocar-paper">
          Es un…
        </legend>
        <div className="flex gap-2">
          {(["objeto", "servicio"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() =>
                setValue("kind", option, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm capitalize transition-colors",
                kind === option
                  ? "border-trocar-accent bg-trocar-accent text-trocar-ink"
                  : "border-trocar-line text-trocar-paper hover:border-trocar-mute",
              )}
            >
              {option}
            </button>
          ))}
        </div>
        <input type="hidden" {...register("kind")} />
      </fieldset>

      <div className="space-y-2">
        <p className="text-sm font-medium text-trocar-paper">Foto</p>
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-trocar-line bg-white px-4 py-6 text-sm text-trocar-mute hover:border-trocar-accent">
          {preview || imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview ?? imageUrl ?? ""}
              alt="Vista previa"
              className="h-36 w-full rounded-xl object-cover"
            />
          ) : (
            <>
              <ImagePlus className="size-6 text-trocar-accent" />
              <span>{uploading ? "Subiendo…" : "Agregar foto"}</span>
            </>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            disabled={uploading || isSubmitting}
            onChange={(e) => {
              void onPickImage(e);
            }}
          />
        </label>
        <input type="hidden" {...register("imageUrl")} />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="title" className="text-sm font-medium text-trocar-paper">
          Título
        </label>
        <TrocarInput
          id="title"
          placeholder="Taladro percutor / Clases de guitarra"
          invalid={Boolean(errors.title)}
          disabled={isSubmitting}
          {...register("title")}
        />
        {errors.title?.message ? (
          <p role="alert" className="text-sm text-red-600">
            {errors.title.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="category"
          className="text-sm font-medium text-trocar-paper"
        >
          Categoría
        </label>
        <select
          id="category"
          className="w-full rounded-xl border border-trocar-line bg-white px-3 py-2.5 text-sm outline-none focus:border-trocar-accent"
          disabled={isSubmitting}
          {...register("category")}
        >
          {POST_CATEGORIES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      {kind === "objeto" ? (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-trocar-paper">
            Condición
          </legend>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["nuevo", "Nuevo"],
                ["como_nuevo", "Como nuevo"],
                ["usado", "Usado"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() =>
                  setValue("condition", value, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm transition-colors",
                  condition === value
                    ? "border-trocar-ink bg-trocar-ink text-white"
                    : "border-trocar-line text-trocar-paper",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}

      <div className="space-y-1.5">
        <label
          htmlFor="description"
          className="text-sm font-medium text-trocar-paper"
        >
          Descripción
        </label>
        <TrocarTextarea
          id="description"
          placeholder="Contá el estado, disponibilidad u horario…"
          invalid={Boolean(errors.description)}
          disabled={isSubmitting}
          {...register("description")}
        />
        {errors.description?.message ? (
          <p role="alert" className="text-sm text-red-600">
            {errors.description.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="lookingFor"
          className="text-sm font-medium text-trocar-paper"
        >
          ¿Qué te gustaría a cambio? (opcional)
        </label>
        <TrocarInput
          id="lookingFor"
          placeholder="Herramientas, ayuda con mudanza, plantas…"
          disabled={isSubmitting}
          {...register("lookingFor")}
        />
      </div>

      <button
        type="button"
        className="text-left text-sm text-trocar-mute underline-offset-2 hover:underline"
        onClick={() => setShowProhibited((v) => !v)}
      >
        {showProhibited ? "▾" : "▸"} Qué no se puede publicar
      </button>
      {showProhibited ? (
        <p className="rounded-xl border border-trocar-line bg-white px-3 py-2 text-sm text-trocar-mute">
          No se permiten: {PROHIBITED_KEYWORDS.slice(0, 6).join(", ")} y
          similares (medicamentos, armas, documentos, animales, servicios
          regulados).
        </p>
      ) : null}

      <div className="space-y-1.5">
        <label htmlFor="barrio" className="text-sm font-medium text-trocar-paper">
          Barrio
        </label>
        <select
          id="barrio"
          className="w-full rounded-xl border border-trocar-line bg-white px-3 py-2.5 text-sm outline-none focus:border-trocar-accent"
          disabled={isSubmitting}
          {...register("barrio")}
        >
          {PILOT_BARRIOS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

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

      <div className="flex flex-wrap gap-3">
        <TrocarButton href={ROUTES.feed} variant="secondary">
          Cancelar
        </TrocarButton>
        <TrocarButton
          type="submit"
          disabled={!isValid || !hasRequired || isSubmitting || uploading}
        >
          {isSubmitting ? (
            <>
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
              Publicando…
            </>
          ) : (
            "Publicar"
          )}
        </TrocarButton>
      </div>
    </form>
  );
}
