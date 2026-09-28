"use client";

import { LoaderCircle } from "lucide-react";
import { useState, type FormEvent } from "react";
import { requestOtpAction, verifyOtpAction } from "@/app/actions/auth";
import { TrocarButton } from "@/components/trocar/button";
import { ROUTES } from "@/constants/routes";

type OtpVerifyFormProps = {
  channel: "email" | "phone";
  to: string;
};

export function OtpVerifyForm({ channel, to }: OtpVerifyFormProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const digits = code.replace(/\D/g, "").slice(0, 6);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setPending(true);
    void verifyOtpAction({ channel, to, code: digits })
      .then((result) => {
        if (result?.error) {
          setError(result.error);
          setPending(false);
        }
      })
      .catch(() => {
        setPending(false);
      });
  };

  const resend = () => {
    setError(null);
    setPending(true);
    void requestOtpAction({ channel, value: to })
      .then((result) => {
        if (result?.error) {
          setError(result.error);
          setPending(false);
        }
      })
      .catch(() => {
        setPending(false);
      });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error ? (
        <p
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      <label className="block space-y-2">
        <span className="text-sm font-medium text-trocar-paper">Código</span>
        <input
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={digits}
          disabled={pending}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
          className="w-full rounded-2xl border border-trocar-line bg-white px-4 py-4 text-center text-2xl tracking-[0.6em] text-trocar-paper outline-none focus:border-trocar-accent focus:ring-2 focus:ring-trocar-accent/15"
          aria-label="Código de 6 números"
        />
      </label>

      <TrocarButton type="submit" className="w-full" disabled={pending || digits.length !== 6}>
        {pending ? (
          <>
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
            Verificando…
          </>
        ) : (
          "Verificar"
        )}
      </TrocarButton>

      <div className="flex items-center justify-between text-sm">
        <TrocarButton href={ROUTES.login} variant="ghost" className="px-0">
          Cambiar dato
        </TrocarButton>
        <button
          type="button"
          className="font-semibold text-trocar-accent disabled:opacity-50"
          disabled={pending}
          onClick={resend}
        >
          Reenviar código
        </button>
      </div>
    </form>
  );
}
