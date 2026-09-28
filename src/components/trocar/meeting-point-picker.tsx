"use client";

import { MEETING_POINTS, type MeetingPointId } from "@/constants/routes";
import { cn } from "@/lib/cn";

type MeetingPointPickerProps = {
  value: MeetingPointId | string | null | undefined;
  onChange: (id: MeetingPointId | null) => void;
  barrio?: string | null;
  disabled?: boolean;
};

export function MeetingPointPicker({
  value,
  onChange,
  barrio,
  disabled,
}: MeetingPointPickerProps) {
  const preferred = barrio
    ? MEETING_POINTS.filter((point) => point.barrio === barrio)
    : [];
  const others = barrio
    ? MEETING_POINTS.filter((point) => point.barrio !== barrio)
    : [...MEETING_POINTS];
  const points = [...preferred, ...others];

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-trocar-paper">
        Punto de encuentro
      </legend>
      <p className="text-xs text-trocar-mute">
        Elegí dónde preferís coordinar el trueque (corredor MdP → Miramar).
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(null)}
          className={cn(
            "rounded-full border px-3 py-1.5 text-sm",
            !value
              ? "border-trocar-ink bg-trocar-ink text-white"
              : "border-trocar-line bg-white text-trocar-paper",
          )}
        >
          Sin definir
        </button>
        {points.map((point) => {
          const active = value === point.id;
          return (
            <button
              key={point.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(point.id)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm",
                active
                  ? "border-trocar-ink bg-trocar-ink text-white"
                  : "border-trocar-line bg-white text-trocar-paper",
              )}
            >
              {point.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
