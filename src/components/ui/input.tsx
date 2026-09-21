import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid = false, type = "text", ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      aria-invalid={invalid || undefined}
      className={cn(
        "w-full rounded-lg border bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors",
        "placeholder:text-zinc-400",
        "focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500",
        "dark:focus:border-zinc-100 dark:focus:ring-zinc-100/10",
        invalid
          ? "border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-400"
          : "border-zinc-300",
        className,
      )}
      {...props}
    />
  );
});
