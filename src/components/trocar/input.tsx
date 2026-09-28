import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const fieldClass =
  "w-full rounded-2xl border border-trocar-line bg-white px-4 py-3 text-sm text-trocar-paper shadow-[0_10px_24px_-20px_rgba(14,58,44,0.7)] outline-none transition-colors placeholder:text-trocar-mute focus:border-trocar-accent focus:ring-2 focus:ring-trocar-accent/15 disabled:cursor-not-allowed disabled:opacity-50";

export type TrocarInputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export const TrocarInput = forwardRef<HTMLInputElement, TrocarInputProps>(
  function TrocarInput({ className, invalid = false, type = "text", ...props }, ref) {
    return (
      <input
        ref={ref}
        type={type}
        aria-invalid={invalid || undefined}
        className={cn(
          fieldClass,
          invalid && "border-red-400 focus:border-red-400 focus:ring-red-400/20",
          className,
        )}
        {...props}
      />
    );
  },
);

export type TrocarTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
};

export const TrocarTextarea = forwardRef<HTMLTextAreaElement, TrocarTextareaProps>(
  function TrocarTextarea({ className, invalid = false, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          fieldClass,
          "min-h-24 resize-y",
          invalid && "border-red-400 focus:border-red-400 focus:ring-red-400/20",
          className,
        )}
        {...props}
      />
    );
  },
);
