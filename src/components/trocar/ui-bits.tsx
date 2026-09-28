import { cn } from "@/lib/cn";

export function initialsFromName(name: string | null | undefined) {
  if (!name?.trim()) return "TV";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "TV";
}

export function AvatarBadge({
  name,
  avatarUrl,
  size = "md",
  badge,
  className,
}: {
  name?: string | null;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
  badge?: string | null;
  className?: string;
}) {
  const sizeClass =
    size === "sm" ? "size-10 text-xs" : size === "lg" ? "size-24 text-2xl" : "size-14 text-sm";

  return (
    <div className={cn("relative inline-flex shrink-0", className)}>
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={name ?? "Avatar"}
          className={cn("rounded-full object-cover ring-2 ring-white", sizeClass)}
        />
      ) : (
        <div
          className={cn(
            "inline-flex items-center justify-center rounded-full bg-trocar-ink font-bold text-white",
            sizeClass,
          )}
        >
          {initialsFromName(name)}
        </div>
      )}
      {badge ? (
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-trocar-ink px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap text-white">
          {badge}
        </span>
      ) : null}
    </div>
  );
}

export function StatPill({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="trocar-card flex-1 px-3 py-3 text-center">
      <p className="font-[family-name:var(--font-display)] text-xl font-bold text-trocar-paper">
        {value}
      </p>
      <p className="text-[10px] tracking-wide text-trocar-mute uppercase">{label}</p>
    </div>
  );
}

export function SegmentedTabs<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex gap-1 rounded-full bg-white p-1 shadow-[0_10px_24px_-20px_rgba(14,58,44,0.7)]">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={cn(
            "flex-1 rounded-full px-3 py-2 text-sm font-semibold",
            value === option.id
              ? "bg-trocar-ink text-white"
              : "text-trocar-mute",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
