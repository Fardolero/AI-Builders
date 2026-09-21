"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { persistRegisteredUser } from "@/lib/register-storage";
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

const SUBMIT_LATENCY_MS = 1_000;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

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

    await wait(SUBMIT_LATENCY_MS);

    try {
      persistRegisteredUser({
        fullName: data.fullName,
        email: data.email,
      });
      reset(REGISTER_FORM_DEFAULT_VALUES);
      setSuccessMessage("Cuenta creada. Ya puedes iniciar sesión.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo completar el registro.";
      setSubmitError(message);
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
    <form
      onSubmit={onSubmit}
      noValidate
      className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
    >
      {successMessage ? (
        <p
          role="status"
          className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
          {successMessage}
        </p>
      ) : null}

      {submitError ? (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
        >
          {submitError}
        </p>
      ) : null}

      <div className="space-y-1.5">
        <label htmlFor="fullName" className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
          Nombre completo
        </label>
        <Input
          id="fullName"
          autoComplete="name"
          placeholder="Ada Lovelace"
          invalid={Boolean(errors.fullName)}
          aria-describedby={errors.fullName ? "fullName-error" : undefined}
          disabled={isSubmitting}
          {...register("fullName")}
        />
        {errors.fullName?.message ? (
          <p id="fullName-error" role="alert" className="text-sm text-red-600 dark:text-red-400">
            {errors.fullName.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
          Correo electrónico
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="ada@example.com"
          invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
          disabled={isSubmitting}
          {...register("email")}
        />
        {errors.email?.message ? (
          <p id="email-error" role="alert" className="text-sm text-red-600 dark:text-red-400">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
          Contraseña
        </label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          invalid={Boolean(errors.password)}
          aria-describedby="password-rules"
          disabled={isSubmitting}
          {...register("password")}
        />
        <ul id="password-rules" className="space-y-1">
          {passwordRules.map((rule) => (
            <li
              key={rule.id}
              className={
                rule.isMet
                  ? "text-xs text-emerald-700 dark:text-emerald-400"
                  : "text-xs text-zinc-500 dark:text-zinc-400"
              }
            >
              {rule.isMet ? "Cumple: " : "Pendiente: "}
              {rule.label}
            </li>
          ))}
        </ul>
        {errors.password?.message ? (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {errors.password.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="confirmPassword"
          className="text-sm font-medium text-zinc-800 dark:text-zinc-100"
        >
          Confirmar contraseña
        </label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          invalid={Boolean(errors.confirmPassword)}
          aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
          disabled={isSubmitting}
          {...register("confirmPassword")}
        />
        {errors.confirmPassword?.message ? (
          <p
            id="confirmPassword-error"
            role="alert"
            className="text-sm text-red-600 dark:text-red-400"
          >
            {errors.confirmPassword.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            className="mt-1 size-4 rounded border-zinc-300 text-zinc-900 accent-zinc-900 dark:border-zinc-600 dark:accent-zinc-100"
            disabled={isSubmitting}
            {...register("acceptTerms")}
          />
          <span>
            Acepto los términos y condiciones. El registro se guarda solo en este
            navegador.
          </span>
        </label>
        {errors.acceptTerms?.message ? (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
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

      <Button type="submit" className="w-full" disabled={isSubmitDisabled}>
        {isSubmitting ? (
          <>
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
            Guardando…
          </>
        ) : (
          "Crear cuenta"
        )}
      </Button>
    </form>
  );
}
