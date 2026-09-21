import { z } from "zod";

const PASSWORD_SPECIAL_CHAR = /[^A-Za-z0-9]/;

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(1, "El nombre completo es obligatorio")
      .min(2, "El nombre completo debe tener al menos 2 caracteres"),
    email: z
      .string()
      .trim()
      .min(1, "El correo electrónico es obligatorio")
      .email("Introduce un correo electrónico válido"),
    password: z
      .string()
      .min(1, "La contraseña es obligatoria")
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .regex(/[A-Z]/, "La contraseña debe incluir al menos una mayúscula")
      .regex(/[0-9]/, "La contraseña debe incluir al menos un número")
      .regex(
        PASSWORD_SPECIAL_CHAR,
        "La contraseña debe incluir al menos un carácter especial",
      ),
    confirmPassword: z.string().min(1, "Confirma tu contraseña"),
    acceptTerms: z
      .boolean()
      .refine((value) => value === true, {
        message: "Debes aceptar los términos y condiciones",
      }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const REGISTER_FORM_DEFAULT_VALUES: RegisterFormValues = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  acceptTerms: false,
};
