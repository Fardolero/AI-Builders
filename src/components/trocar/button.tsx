import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type TrocarButtonProps = {
  children: ReactNode;
  className?: string;
  href?: string;
  variant?: "primary" | "secondary" | "ghost";
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: () => void;
};

const variants = {
  primary:
    "trocar-glass-mint trocar-grain relative text-trocar-ink hover:brightness-95 disabled:opacity-50",
  secondary:
    "trocar-glass-light trocar-grain relative text-trocar-ink hover:brightness-105 disabled:opacity-50",
  ghost: "text-trocar-mute hover:text-trocar-ink disabled:opacity-50",
} as const;

export function TrocarButton({
  children,
  className,
  href,
  variant = "primary",
  type = "button",
  disabled,
  onClick,
}: TrocarButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-trocar-accent",
    variants[variant],
    className,
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}
