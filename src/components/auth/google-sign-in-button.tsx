"use client";

import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { signInWithGoogleAction } from "@/app/actions/auth";
import { TrocarButton } from "@/components/trocar/button";

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.6h5.1c-.2 1.2-1.5 3.6-5.1 3.6-3.1 0-5.6-2.5-5.6-5.6S8.9 6.2 12 6.2c1.8 0 2.9.7 3.6 1.4l2.5-2.4C16.6 3.7 14.5 2.7 12 2.7 6.9 2.7 2.7 6.9 2.7 12S6.9 21.3 12 21.3c5.5 0 9.1-3.9 9.1-9.3 0-.6-.1-1.1-.2-1.6H12z"
      />
      <path
        fill="#34A853"
        d="M3.2 7.4 6.2 9.6C7 7.7 9.3 6.2 12 6.2c1.8 0 2.9.7 3.6 1.4l2.5-2.4C16.6 3.7 14.5 2.7 12 2.7 8.2 2.7 4.9 4.8 3.2 7.4z"
      />
      <path
        fill="#4A90E2"
        d="M12 21.3c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.5-1.8.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8l-3 2.3c1.7 3.3 5.1 5 8.1 5z"
      />
      <path
        fill="#FBBC05"
        d="M3.2 16.6c-.5-1.1-.8-2.3-.8-3.6s.3-2.5.8-3.6l3 2.3c-.2.5-.3 1.1-.3 1.6s.1 1.1.3 1.6l-3 1.7z"
      />
    </svg>
  );
}

type GoogleSignInButtonProps = {
  label?: string;
};

export function GoogleSignInButton({
  label = "Continuar con Google",
}: GoogleSignInButtonProps) {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onClick = async () => {
    setError(null);
    setPending(true);
    const next = searchParams.get("next") ?? undefined;
    const result = await signInWithGoogleAction(next);
    if (result?.error) {
      setError(result.error);
      setPending(false);
    }
  };

  return (
    <div className="space-y-2">
      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200"
        >
          {error}
        </p>
      ) : null}
      <TrocarButton
        type="button"
        variant="secondary"
        className="w-full"
        disabled={pending}
        onClick={() => {
          void onClick();
        }}
      >
        {pending ? (
          <>
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
            Redirigiendo…
          </>
        ) : (
          <>
            <GoogleMark className="size-4" />
            {label}
          </>
        )}
      </TrocarButton>
    </div>
  );
}
