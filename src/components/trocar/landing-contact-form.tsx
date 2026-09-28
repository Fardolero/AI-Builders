"use client";

import { useState, type FormEvent } from "react";
import { TrocarButton } from "@/components/trocar/button";

export function LandingContactForm() {
  const [sent, setSent] = useState(false);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSent(true);
  };

  if (sent) {
    return (
      <p
        role="status"
        className="rounded-2xl bg-white px-5 py-6 text-sm text-trocar-soil ring-1 ring-black/5"
      >
        Gracias. Te responderemos a la brevedad.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input
        name="name"
        required
        placeholder="Tu nombre"
        className="w-full rounded-2xl border-0 bg-white px-4 py-3 text-sm text-trocar-soil outline-none ring-1 ring-black/5 placeholder:text-trocar-mute focus:ring-2 focus:ring-trocar-leaf/30"
      />
      <input
        name="email"
        type="email"
        required
        placeholder="Email"
        className="w-full rounded-2xl border-0 bg-white px-4 py-3 text-sm text-trocar-soil outline-none ring-1 ring-black/5 placeholder:text-trocar-mute focus:ring-2 focus:ring-trocar-leaf/30"
      />
      <textarea
        name="message"
        required
        rows={4}
        placeholder="Tu mensaje"
        className="w-full resize-y rounded-2xl border-0 bg-white px-4 py-3 text-sm text-trocar-soil outline-none ring-1 ring-black/5 placeholder:text-trocar-mute focus:ring-2 focus:ring-trocar-leaf/30"
      />
      <TrocarButton
        type="submit"
        className="rounded-full bg-trocar-leaf px-6 text-white hover:bg-trocar-leaf-deep"
      >
        Enviar mensaje
      </TrocarButton>
    </form>
  );
}
