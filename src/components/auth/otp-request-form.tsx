"use client";

import { LoaderCircle } from "lucide-react";
import { useState, type FormEvent } from "react";
import { requestOtpAction } from "@/app/actions/auth";
import { TrocarButton } from "@/components/trocar/button";
import { TrocarInput } from "@/components/trocar/input";
import { cn } from "@/lib/cn";

type Channel = "email" | "phone";

export function OtpRequestForm() {
  const [channel, setChannel] = useState<Channel>("email");
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setPending(true);
    void requestOtpAction({ channel, value })
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
      <div className="grid grid-cols-2 gap-2 rounded-full bg-white p-1 shadow-[0_10px_24px_-20px_rgba(14,58,44,0.7)]">
        {(
          [
            ["email", "Correo"],
            ["phone", "Teléfono"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setChannel(id);
              setValue("");
              setError(null);
            }}
            className={cn(
              "rounded-full px-3 py-2 text-sm font-semibold",
              channel === id ? "bg-trocar-ink text-white" : "text-trocar-mute",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      <div className="space-y-1.5">
        <label htmlFor="otp-value" className="text-sm font-medium text-trocar-paper">
          {channel === "email" ? "Correo electrónico" : "Celular"}
        </label>
        <TrocarInput
          id="otp-value"
          type={channel === "email" ? "email" : "tel"}
          inputMode={channel === "email" ? "email" : "tel"}
          autoComplete={channel === "email" ? "email" : "tel"}
          placeholder={channel === "email" ? "ada@example.com" : "11 5555 5555"}
          value={value}
          disabled={pending}
          onChange={(event) => setValue(event.target.value)}
        />
        {channel === "phone" ? (
          <p className="text-xs text-trocar-mute">Te escribimos un SMS al +54.</p>
        ) : (
          <p className="text-xs text-trocar-mute">
            Te enviamos un código de 6 números. Si no tenés cuenta, se crea al verificar.
          </p>
        )}
      </div>

      <TrocarButton type="submit" className="w-full" disabled={pending || value.trim().length < 3}>
        {pending ? (
          <>
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
            Enviando código…
          </>
        ) : (
          "Enviar código"
        )}
      </TrocarButton>
    </form>
  );
}
