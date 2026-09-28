"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { signUpAction } from "@/app/actions/auth";
import { TrocarButton } from "@/components/trocar/button";
import { TrocarInput } from "@/components/trocar/input";
import { ROUTES } from "@/constants/routes";
import {
  REGISTER_FORM_DEFAULT_VALUES,
  registerSchema,
  type RegisterFormValues,
} from "@/lib/validations/register";

type PasswordRule = {
  id: "length" | "uppercase" | "number" | "special";
  label: string;
  isMet: boolean;
};

function hasRequiredFields(values: RegisterFormValues): boolean {
  return (
    values.fullName.trim().length > 0 &&
    values.email.trim().length > 0 &&
    values.password.length > 0 &&
    values.confirmPassword.length > 0 &&
    values.acceptTerms === true
  );
}

export function RegisterForm() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting, isValid },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues: REGISTER_FORM_DEFAULT_VALUES,
  });

  const values = watch();
  const password = values.password ?? "";

  const passwordRules = useMemo<PasswordRule[]>(
    () => [
      {
        id: "length",
        label: "Mínimo 8 caracteres",
        isMet: password.length >= 8,
      },
      {
        id: "uppercase",
        label: "Al menos una mayúscula",
        isMet: /[A-Z]/.test(password),
      },
      {
        id: "number",
        label: "Al menos un número",
        isMet: /[0-9]/.test(password),
      },
      {
        id: "special",
        label: "Al menos un carácter especial",
        isMet: /[^A-Za-z0-9]/.test(password),
      },
    ],
    [password],
  );

  const isSubmitDisabled =
    !isValid || !hasRequiredFields(values) || isSubmitting;

  const onValidSubmit = async (data: RegisterFormValues): Promise<void> => {
    setSubmitError(null);
    setSuccessMessage(null);

    const result = await signUpAction(data);

    if (result?.error) {
      setSubmitError(result.error);
      return;
    }

    if (result?.success) {
      reset(REGISTER_FORM_DEFAULT_VALUES);
      setSuccessMessage(result.success);
    }
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    void handleSubmit(onValidSubmit)(event);
  };

  const fieldErrors = Object.entries(errors)
    .map(([field, error]) => ({
      id: field,
      message: error?.message ?? "Campo inválido",
    }))
    .filter((item) => item.message.length > 0);

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {successMessage ? (
        <p
          role="status"
          className="flex items-start gap-2 rounded-xl border border-trocar-accent/40 bg-trocar-accent/10 px-3 py-2 text-sm text-trocar-accent"
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
          {successMessage}
        </p>
      ) : null}

      {submitError ? (
        <p
          role="alert"
          className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200"
        >
          {submitError}
        </p>
      ) : null}

      <div className="space-y-1.5">
        <label htmlFor="fullName" className="text-sm font-medium text-trocar-paper">
          Nombre completo
        </label>
        <TrocarInput
          id="fullName"
          autoComplete="name"
          placeholder="Ada Lovelace"
          invalid={Boolean(errors.fullName)}
          disabled={isSubmitting}
          {...register("fullName")}
        />
        {errors.fullName?.message ? (
          <p role="alert" className="text-sm text-red-300">
            {errors.fullName.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium text-trocar-paper">
          Correo electrónico
        </label>
        <TrocarInput
          id="email"
          type="email"
          autoComplete="email"
          placeholder="ada@example.com"
          invalid={Boolean(errors.email)}
          disabled={isSubmitting}
          {...register("email")}
        />
        {errors.email?.message ? (
          <p role="alert" className="text-sm text-red-300">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium text-trocar-paper">
          Contraseña
        </label>
        <TrocarInput
          id="password"
          type="password"
          autoComplete="new-password"
          invalid={Boolean(errors.password)}
          disabled={isSubmitting}
          {...register("password")}
        />
        <ul className="space-y-1">
          {passwordRules.map((rule) => (
            <li
              key={rule.id}
              className={
                rule.isMet ? "text-xs text-trocar-accent" : "text-xs text-trocar-mute"
              }
            >
              {rule.isMet ? "Cumple: " : "Pendiente: "}
              {rule.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="confirmPassword" className="text-sm font-medium text-trocar-paper">
          Confirmar contraseña
        </label>
        <TrocarInput
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          invalid={Boolean(errors.confirmPassword)}
          disabled={isSubmitting}
          {...register("confirmPassword")}
        />
        {errors.confirmPassword?.message ? (
          <p role="alert" className="text-sm text-red-300">
            {errors.confirmPassword.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label className="flex items-start gap-2 text-sm text-trocar-mute">
          <input
            type="checkbox"
            className="mt-1 size-4 rounded border-trocar-line accent-trocar-accent"
            disabled={isSubmitting}
            {...register("acceptTerms")}
          />
          <span>
            Acepto los{" "}
            <Link
              href={ROUTES.terms}
              className="font-medium text-trocar-accent underline-offset-4 hover:underline"
            >
              términos y condiciones
            </Link>
            .
          </span>
        </label>
        {errors.acceptTerms?.message ? (
          <p role="alert" className="text-sm text-red-300">
            {errors.acceptTerms.message}
          </p>
        ) : null}
      </div>

      {fieldErrors.length > 0 ? (
        <ul className="sr-only">
          {fieldErrors.map((item) => (
            <li key={item.id}>{item.message}</li>
          ))}
        </ul>
      ) : null}

      <TrocarButton type="submit" className="w-full" disabled={isSubmitDisabled}>
        {isSubmitting ? (
          <>
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
            Creando…
          </>
        ) : (
          "Crear cuenta"
        )}
      </TrocarButton>
    </form>
  );
}
