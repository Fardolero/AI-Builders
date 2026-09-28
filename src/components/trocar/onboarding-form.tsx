"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useForm } from "react-hook-form";
import { completeOnboardingAction } from "@/app/actions/onboarding";
import { TrocarButton } from "@/components/trocar/button";
import { TrocarInput, TrocarTextarea } from "@/components/trocar/input";
import { INTEREST_OPTIONS, PILOT_BARRIOS, ROUTES } from "@/constants/routes";
import {
  ONBOARDING_DEFAULT_VALUES,
  onboardingSchema,
  type OnboardingFormValues,
} from "@/lib/validations/onboarding";
import { cn } from "@/lib/cn";
import Link from "next/link";

const INTRO_STEPS = [
  {
    id: "publish",
    title: "Publicá lo que ya no usás",
    body: "Subí un objeto o un servicio que puedas ofrecer y elegí qué te gustaría recibir a cambio.",
  },
  {
    id: "chat",
    title: "Chateá y acordá",
    body: "Mirá otras necesidades y proponé un intercambio directo con otro vecino.",
  },
  {
    id: "credits",
    title: "Sumá Créditos Vecinales",
    body: "Cada trueque confirmado suma reputación y confianza en tu perfil.",
  },
] as const;

type OnboardingFormProps = {
  defaultBarrio?: string | null;
  defaultBio?: string | null;
  defaultInterests?: string[] | null;
  fullName?: string | null;
};

export function OnboardingForm({
  defaultBarrio,
  defaultBio,
  defaultInterests,
  fullName,
}: OnboardingFormProps) {
  const [step, setStep] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const initialBarrio = PILOT_BARRIOS.includes(
    defaultBarrio as (typeof PILOT_BARRIOS)[number],
  )
    ? (defaultBarrio as (typeof PILOT_BARRIOS)[number])
    : ONBOARDING_DEFAULT_VALUES.barrio;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    mode: "onChange",
    defaultValues: {
      fullName: fullName ?? "",
      barrio: initialBarrio,
      bio: defaultBio ?? "",
      interests: (defaultInterests ?? []).filter((item): item is (typeof INTEREST_OPTIONS)[number] =>
        INTEREST_OPTIONS.includes(item as (typeof INTEREST_OPTIONS)[number]),
      ),
    },
  });

  const barrio = watch("barrio");
  const interests = watch("interests") ?? [];
  const introIndex = Math.min(step, INTRO_STEPS.length - 1);
  const intro = INTRO_STEPS[introIndex]!;

  const onValidSubmit = async (data: OnboardingFormValues): Promise<void> => {
    setSubmitError(null);
    const result = await completeOnboardingAction({
      ...data,
      interests: data.interests ?? [],
    });
    if (result?.error) {
      setSubmitError(result.error);
    }
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (step < INTRO_STEPS.length) {
      setStep((current) => current + 1);
      return;
    }
    void handleSubmit(onValidSubmit)(event);
  };

  const toggleInterest = (interest: (typeof INTEREST_OPTIONS)[number]) => {
    const next = interests.includes(interest)
      ? interests.filter((item) => item !== interest)
      : [...interests, interest];
    setValue("interests", next, { shouldValidate: true, shouldDirty: true });
  };

  if (step < INTRO_STEPS.length) {
    return (
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="flex justify-end">
          <button
            type="button"
            className="text-sm text-trocar-mute"
            onClick={() => setStep(INTRO_STEPS.length)}
          >
            Saltar
          </button>
        </div>
        <div className="aspect-[4/3] rounded-3xl bg-gradient-to-br from-trocar-leaf to-trocar-mint" />
        <div className="space-y-2">
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
            {intro.title}
          </h1>
          <p className="text-sm text-trocar-mute">{intro.body}</p>
        </div>
        <div className="flex justify-center gap-2">
          {INTRO_STEPS.map((item, index) => (
            <span
              key={item.id}
              className={cn(
                "size-2 rounded-full",
                index === step ? "bg-trocar-ink" : "bg-trocar-line",
              )}
            />
          ))}
        </div>
        <TrocarButton type="submit" className="w-full">
          Siguiente →
        </TrocarButton>
        <p className="text-center text-sm text-trocar-mute">
          <Link href={ROUTES.login} className="font-semibold text-trocar-accent">
            Ya tengo una cuenta
          </Link>
        </p>
      </form>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-[0.16em] text-trocar-mute uppercase">
          Completá tu perfil
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
          Contale al barrio quién sos
        </h1>
      </div>

      {submitError ? (
        <p
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {submitError}
        </p>
      ) : null}

      <div className="space-y-1.5">
        <label htmlFor="fullName" className="text-sm font-medium">
          Nombre completo
        </label>
        <TrocarInput id="fullName" disabled={isSubmitting} {...register("fullName")} />
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Barrio piloto</legend>
        <div className="flex flex-wrap gap-2">
          {PILOT_BARRIOS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() =>
                setValue("barrio", option, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm",
                barrio === option
                  ? "border-trocar-ink bg-trocar-ink text-white"
                  : "border-trocar-line bg-white text-trocar-paper",
              )}
            >
              {option}
            </button>
          ))}
        </div>
        <input type="hidden" {...register("barrio")} />
        {errors.barrio?.message ? (
          <p role="alert" className="text-sm text-red-700">
            {errors.barrio.message}
          </p>
        ) : null}
      </fieldset>

      <div className="space-y-1.5">
        <label htmlFor="bio" className="text-sm font-medium">
          Sobre vos (opcional)
        </label>
        <TrocarTextarea
          id="bio"
          placeholder="Contale al barrio en qué te gusta ayudar…"
          disabled={isSubmitting}
          {...register("bio")}
        />
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Intereses (para tus matches)</legend>
        <div className="flex flex-wrap gap-2">
          {INTEREST_OPTIONS.map((interest) => {
            const selected = interests.includes(interest);
            return (
              <button
                key={interest}
                type="button"
                onClick={() => toggleInterest(interest)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm",
                  selected
                    ? "border-trocar-ink bg-trocar-ink text-white"
                    : "border-trocar-line bg-white text-trocar-paper",
                )}
              >
                {interest}
              </button>
            );
          })}
        </div>
      </fieldset>

      <TrocarButton type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
            Guardando…
          </>
        ) : (
          "Empezar a explorar"
        )}
      </TrocarButton>
    </form>
  );
}
