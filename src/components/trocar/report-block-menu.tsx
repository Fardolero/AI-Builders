"use client";

import { Flag, Ban, MoreHorizontal } from "lucide-react";
import { useState, useTransition } from "react";
import {
  blockUserAction,
  reportUserOrPostAction,
} from "@/app/actions/moderation";
import { TrocarButton } from "@/components/trocar/button";
import { TrocarTextarea } from "@/components/trocar/input";
import { cn } from "@/lib/cn";

type ReportBlockMenuProps = {
  targetUserId?: string;
  targetPostId?: string;
  className?: string;
};

export function ReportBlockMenu({
  targetUserId,
  targetPostId,
  className,
}: ReportBlockMenuProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"menu" | "report" | "done">("menu");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const close = () => {
    setOpen(false);
    setMode("menu");
    setReason("");
    setError(null);
  };

  const onReport = () => {
    startTransition(async () => {
      setError(null);
      const result = await reportUserOrPostAction({
        reason,
        targetUserId,
        targetPostId,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setMode("done");
    });
  };

  const onBlock = () => {
    if (!targetUserId) return;
    startTransition(async () => {
      setError(null);
      const result = await blockUserAction(targetUserId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setMode("done");
    });
  };

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        aria-label="Más opciones"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex size-10 items-center justify-center rounded-full bg-white/90 text-trocar-ink shadow-sm ring-1 ring-trocar-line"
      >
        <MoreHorizontal className="size-5" />
      </button>

      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-64 rounded-2xl border border-trocar-line bg-white p-3 shadow-lg">
          {mode === "menu" ? (
            <div className="space-y-1">
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-trocar-mist"
                onClick={() => setMode("report")}
              >
                <Flag className="size-4 text-trocar-mute" />
                Reportar
              </button>
              {targetUserId ? (
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50"
                  onClick={onBlock}
                  disabled={pending}
                >
                  <Ban className="size-4" />
                  Bloquear
                </button>
              ) : null}
              <button
                type="button"
                className="w-full rounded-xl px-3 py-2 text-left text-sm text-trocar-mute"
                onClick={close}
              >
                Cancelar
              </button>
            </div>
          ) : null}

          {mode === "report" ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-trocar-paper">
                ¿Por qué reportás?
              </p>
              <TrocarTextarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Contá el motivo…"
                rows={3}
              />
              {error ? (
                <p role="alert" className="text-sm text-red-600">
                  {error}
                </p>
              ) : null}
              <div className="flex gap-2">
                <TrocarButton
                  type="button"
                  className="flex-1"
                  disabled={pending || reason.trim().length < 5}
                  onClick={onReport}
                >
                  Enviar
                </TrocarButton>
                <TrocarButton
                  type="button"
                  variant="secondary"
                  onClick={() => setMode("menu")}
                >
                  Atrás
                </TrocarButton>
              </div>
            </div>
          ) : null}

          {mode === "done" ? (
            <div className="space-y-3 p-1">
              <p className="text-sm text-trocar-paper">
                Listo. Gracias por ayudarnos a cuidar la comunidad.
              </p>
              {error ? (
                <p role="alert" className="text-sm text-red-600">
                  {error}
                </p>
              ) : null}
              <TrocarButton type="button" className="w-full" onClick={close}>
                Cerrar
              </TrocarButton>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
