"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

const FAQ_ITEMS = [
  {
    id: "que-es",
    question: "¿Qué es Trocar?",
    answer:
      "Una app gratuita para intercambiar cosas y servicios con vecinos de tu barrio, sin usar dinero.",
  },
  {
    id: "como-funciona",
    question: "¿Cómo funciona un trueque?",
    answer:
      "Publicás lo que no usás, proponés un intercambio, lo coordinás por el chat de la app y se encuentran en un lugar público. Después, los dos confirman el trueque en Trocar.",
  },
  {
    id: "creditos",
    question: "¿Qué son los créditos vecinales?",
    answer:
      "Son puntos que muestran que sos un vecino confiable. No son dinero: no se transfieren, no se venden y no se canjean por productos.",
  },
  {
    id: "como-gano",
    question: "¿Cómo gano créditos vecinales?",
    answer:
      "Cada trueque confirmado por las dos partes te suma créditos. Si además calificás y dejás un comentario, sumás un bono extra.",
  },
  {
    id: "para-que",
    question: "¿Para qué sirven?",
    answer:
      "Generan confianza en tu perfil y desbloquean beneficios en la app, como publicaciones destacadas y más publicaciones activas.",
  },
  {
    id: "confiable",
    question: "¿Cómo sé si un vecino es confiable?",
    answer:
      "Mirá su perfil: créditos, trueques completados, calificaciones y comentarios de otros vecinos.",
  },
  {
    id: "direccion",
    question: "¿Trocar muestra mi dirección?",
    answer: "No. Solo se ve tu barrio y una distancia aproximada.",
  },
  {
    id: "sale-mal",
    question: "¿Qué hago si algo sale mal?",
    answer:
      "No confirmes el trueque y reportalo desde la conversación. Nuestro equipo revisa cada caso.",
  },
] as const;

export function LandingFaq() {
  const [openId, setOpenId] = useState<string>(FAQ_ITEMS[0].id);

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5">
      {FAQ_ITEMS.map((item, index) => {
        const isOpen = openId === item.id;
        return (
          <div
            key={item.id}
            className={cn(index > 0 && "border-t border-trocar-mist-deep")}
          >
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              aria-expanded={isOpen}
              onClick={() => setOpenId(isOpen ? "" : item.id)}
            >
              <span className="font-[family-name:var(--font-serif)] text-lg font-semibold text-trocar-soil">
                {item.question}
              </span>
              <ChevronDown
                className={cn(
                  "size-5 shrink-0 text-trocar-leaf transition-transform",
                  isOpen && "rotate-180",
                )}
                aria-hidden
              />
            </button>
            {isOpen ? (
              <p className="px-5 pb-5 text-sm leading-relaxed text-trocar-mute">
                {item.answer}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
