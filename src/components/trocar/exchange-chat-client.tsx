"use client";

import { useState, useTransition, type FormEvent } from "react";
import {
  acceptExchangeAction,
  cancelExchangeAction,
  confirmExchangeAction,
  counterExchangeAction,
  rejectExchangeAction,
  reviseOfferAction,
  sendExchangeMessageAction,
} from "@/app/actions/exchanges";
import { TrocarButton } from "@/components/trocar/button";
import { TrocarInput, TrocarTextarea } from "@/components/trocar/input";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/cn";
import { exchangeStatusLabel } from "@/lib/trocar/exchange-status";

type Message = {
  id: string;
  body: string;
  sender_id: string;
  created_at: string;
};

type ExchangeChatProps = {
  exchangeId: string;
  status: string;
  offerText: string;
  counterText: string | null;
  currentUserId: string;
  isOwner: boolean;
  isProposer: boolean;
  proposerConfirmed: boolean;
  ownerConfirmed: boolean;
  messages: Message[];
  postTitle: string;
  postId: string;
};

const STEPS = ["Propuesta", "Acuerdo", "Encuentro", "Confirmación"] as const;

function stepIndex(status: string, bothConfirmed: boolean): number {
  if (status === "completed" || bothConfirmed) return 3;
  if (status === "coordinating" || status === "accepted") return 2;
  if (status === "countered") return 1;
  if (status === "pending") return 0;
  return 0;
}

export function ExchangeChatClient({
  exchangeId,
  status,
  offerText,
  counterText,
  currentUserId,
  isOwner,
  isProposer,
  proposerConfirmed,
  ownerConfirmed,
  messages,
  postTitle,
  postId,
}: ExchangeChatProps) {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [counter, setCounter] = useState("");
  const [revision, setRevision] = useState(offerText);
  const [isPending, startTransition] = useTransition();

  const iConfirmed = isProposer ? proposerConfirmed : ownerConfirmed;
  const theyConfirmed = isProposer ? ownerConfirmed : proposerConfirmed;
  const bothConfirmed = proposerConfirmed && ownerConfirmed;
  const activeStep = stepIndex(status, bothConfirmed);

  const run = (fn: () => Promise<{ error: string | null } | void>) => {
    setError(null);
    startTransition(async () => {
      const result = await fn();
      if (result && "error" in result && result.error) {
        setError(result.error);
      }
    });
  };

  const onSend = (event: FormEvent) => {
    event.preventDefault();
    if (!message.trim()) return;
    run(async () => {
      const result = await sendExchangeMessageAction({
        exchangeId,
        body: message.trim(),
      });
      if (!result.error) {
        setMessage("");
      }
      return result;
    });
  };

  return (
    <div className="space-y-6">
      <div className="trocar-card space-y-3 p-4 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-trocar-mist-deep px-2.5 py-0.5 text-xs font-semibold text-trocar-accent uppercase">
            {exchangeStatusLabel(status)}
          </span>
          <span className="text-trocar-mute">
            {postTitle} ⇄ {offerText.slice(0, 48)}
            {offerText.length > 48 ? "…" : ""}
          </span>
        </div>
        <p className="text-trocar-mute">Publicación</p>
        <p className="font-medium text-trocar-paper">{postTitle}</p>
        <p className="mt-2 text-trocar-mute">Oferta</p>
        <p className="text-trocar-paper">{offerText}</p>
        {counterText ? (
          <>
            <p className="mt-2 text-trocar-mute">Contraoferta</p>
            <p className="text-trocar-accent">{counterText}</p>
          </>
        ) : null}
      </div>

      {(status === "coordinating" ||
        status === "accepted" ||
        status === "completed" ||
        status === "pending" ||
        status === "countered") && (
        <ol className="grid grid-cols-4 gap-1">
          {STEPS.map((label, index) => (
            <li
              key={label}
              className={cn(
                "rounded-xl px-1 py-2 text-center text-[10px] font-semibold sm:text-xs",
                index <= activeStep
                  ? "bg-trocar-ink text-white"
                  : "bg-trocar-mist-deep text-trocar-mute",
              )}
            >
              {label}
            </li>
          ))}
        </ol>
      )}

      {error ? (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : null}

      {(status === "pending" || status === "countered") && isOwner ? (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <TrocarButton
              disabled={isPending}
              onClick={() => run(() => acceptExchangeAction(exchangeId))}
            >
              Aceptar
            </TrocarButton>
            <TrocarButton
              variant="secondary"
              disabled={isPending}
              onClick={() => run(() => rejectExchangeAction(exchangeId))}
            >
              Rechazar
            </TrocarButton>
          </div>
          <div className="space-y-2">
            <TrocarTextarea
              value={counter}
              onChange={(e) => setCounter(e.target.value)}
              placeholder="O escribí una contraoferta…"
              disabled={isPending}
            />
            <TrocarButton
              variant="secondary"
              disabled={isPending || counter.trim().length < 5}
              onClick={() =>
                run(() =>
                  counterExchangeAction({
                    exchangeId,
                    counterText: counter.trim(),
                  }),
                )
              }
            >
              Enviar contraoferta
            </TrocarButton>
          </div>
        </div>
      ) : null}

      {status === "countered" && isProposer ? (
        <div className="trocar-card space-y-3 p-4">
          <p className="text-sm text-trocar-paper">
            El vecino contraofertó. Podés aceptarla o ajustar lo que ofrecés.
          </p>
          <TrocarButton
            disabled={isPending}
            onClick={() => run(() => acceptExchangeAction(exchangeId))}
          >
            Aceptar contraoferta
          </TrocarButton>
          <TrocarTextarea
            value={revision}
            onChange={(event) => setRevision(event.target.value)}
            disabled={isPending}
          />
          <TrocarButton
            variant="secondary"
            disabled={isPending || revision.trim().length < 5}
            onClick={() =>
              run(() =>
                reviseOfferAction({
                  exchangeId,
                  offerText: revision.trim(),
                }),
              )
            }
          >
            Ajustar mi propuesta
          </TrocarButton>
        </div>
      ) : null}

      {(status === "coordinating" || status === "accepted") && (
        <div className="trocar-card space-y-3 p-4">
          <p className="rounded-xl border border-trocar-accent/30 bg-trocar-mist-deep px-3 py-2 text-sm text-trocar-paper">
            Encontrate en un lugar público y con luz.
          </p>
          <p className="text-sm text-trocar-paper">
            Coordiná el encuentro por el chat. Cuando el trueque ocurra,
            confirmalo.
          </p>
          <p className="text-xs text-trocar-mute">
            Confirmado por vos
            {iConfirmed ? "" : " · esperando"} ·{" "}
            {theyConfirmed
              ? "contraparte también confirmó"
              : "esperando a la contraparte"}
          </p>
          {!iConfirmed ? (
            <TrocarButton
              disabled={isPending}
              onClick={() => run(() => confirmExchangeAction(exchangeId))}
            >
              Ya hicimos el intercambio
            </TrocarButton>
          ) : (
            <p className="text-sm text-trocar-accent">
              Confirmado por vos · esperando a la otra parte…
            </p>
          )}
          <TrocarButton
            variant="secondary"
            disabled={isPending}
            onClick={() => run(() => cancelExchangeAction(exchangeId))}
          >
            Cancelar intercambio
          </TrocarButton>
        </div>
      )}

      {status === "completed" ? (
        <TrocarButton href={ROUTES.exchangeRate(exchangeId)}>
          Ir a calificar
        </TrocarButton>
      ) : null}

      {status === "rejected" || status === "cancelled" ? (
        <div className="trocar-card space-y-3 p-4">
          <p className="text-sm text-trocar-mute">
            {status === "cancelled"
              ? "Intercambio cancelado."
              : "Propuesta rechazada. Podés volver a la publicación."}
          </p>
          <TrocarButton href={ROUTES.post(postId)} variant="secondary">
            Volver a la publicación
          </TrocarButton>
        </div>
      ) : null}

      <section className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">
          Chat
        </h2>
        <ul className="space-y-2">
          {messages.map((item) => {
            const mine = item.sender_id === currentUserId;
            return (
              <li
                key={item.id}
                className={
                  mine
                    ? "ml-8 rounded-2xl bg-trocar-accent/15 px-3 py-2 text-sm text-trocar-paper"
                    : "mr-8 rounded-2xl border border-trocar-line px-3 py-2 text-sm text-trocar-mute"
                }
              >
                {item.body}
              </li>
            );
          })}
        </ul>
        {status !== "rejected" &&
        status !== "completed" &&
        status !== "cancelled" ? (
          <form onSubmit={onSend} className="flex gap-2">
            <TrocarInput
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribí un mensaje…"
              disabled={isPending}
              className="flex-1"
            />
            <TrocarButton type="submit" disabled={isPending || !message.trim()}>
              Enviar
            </TrocarButton>
          </form>
        ) : null}
      </section>
    </div>
  );
}
