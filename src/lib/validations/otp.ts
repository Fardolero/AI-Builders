import { z } from "zod";

export const otpChannelSchema = z.enum(["email", "phone"]);

export const otpRequestSchema = z
  .object({
    channel: otpChannelSchema,
    value: z.string().trim().min(1, "Completá este dato"),
  })
  .superRefine((data, ctx) => {
    if (data.channel === "email") {
      const email = z.string().email().safeParse(data.value);
      if (!email.success) {
        ctx.addIssue({
          code: "custom",
          path: ["value"],
          message: "Ingresá un correo válido",
        });
      }
      return;
    }

    if (!normalizeArgentinePhone(data.value)) {
      ctx.addIssue({
        code: "custom",
        path: ["value"],
        message: "Ingresá un celular válido, por ejemplo 11 5555 5555",
      });
    }
  });

export const otpVerifySchema = z.object({
  channel: otpChannelSchema,
  to: z.string().trim().min(1),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "El código tiene 6 números"),
});

export type OtpRequestValues = z.infer<typeof otpRequestSchema>;
export type OtpVerifyValues = z.infer<typeof otpVerifySchema>;

export function normalizeArgentinePhone(raw: string): string | null {
  const compact = raw.replace(/[^\d+]/g, "");
  if (compact.startsWith("+")) {
    return compact.length >= 11 ? compact : null;
  }

  let digits = compact.replace(/^0+/, "");
  if (digits.startsWith("54")) {
    digits = digits.slice(2);
  }

  if (digits.length === 10) {
    return `+549${digits}`;
  }

  if (digits.startsWith("9") && digits.length === 11) {
    return `+54${digits}`;
  }

  return null;
}
