"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useForm } from "react-hook-form";
import { signInWithPasswordAction } from "@/app/actions/auth";
import { TrocarButton } from "@/components/trocar/button";
import { TrocarInput } from "@/components/trocar/input";
import {
  LOGIN_FORM_DEFAULT_VALUES,
  loginSchema,
  type LoginFormValues,
} from "@/lib/validations/login";

function hasRequiredFields(values: LoginFormValues): boolean {
  return values.email.trim().length > 0 && values.password.length > 0;
}

export function LoginForm() {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isValid },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: LOGIN_FORM_DEFAULT_VALUES,
  });

  const values = watch();
  const isAuthenticating = isSubmitting;
  const isSubmitDisabled =
    !isValid || !hasRequiredFields(values) || isAuthenticating;

  const onValidSubmit = async (data: LoginFormValues): Promise<void> => {
    setSubmitError(null);
    const result = await signInWithPasswordAction(data);
    if (result?.error) {
      setSubmitError(result.error);
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
      {submitError ? (
        <p
          role="alert"
          className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200"
        >
          {submitError}
        </p>
      ) : null}

      <div className="space-y-1.5">
        <label htmlFor="login-email" className="text-sm font-medium text-trocar-paper">
          Correo electrónico
        </label>
        <TrocarInput
          id="login-email"
          type="email"
          autoComplete="email"
          placeholder="ada@example.com"
          invalid={Boolean(errors.email)}
          disabled={isAuthenticating}
          {...register("email")}
        />
        {errors.email?.message ? (
          <p role="alert" className="text-sm text-red-300">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="login-password" className="text-sm font-medium text-trocar-paper">
          Contraseña
        </label>
        <TrocarInput
          id="login-password"
          type="password"
          autoComplete="current-password"
          invalid={Boolean(errors.password)}
          disabled={isAuthenticating}
          {...register("password")}
        />
        {errors.password?.message ? (
          <p role="alert" className="text-sm text-red-300">
            {errors.password.message}
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
        {isAuthenticating ? (
          <>
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
            Verificando…
          </>
        ) : (
          "Iniciar sesión"
        )}
      </TrocarButton>
    </form>
  );
}
