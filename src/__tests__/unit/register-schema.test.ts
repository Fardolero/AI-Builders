import { describe, expect, it } from "vitest";
import { registerSchema } from "@/lib/validations/register";

const validPayload = {
  fullName: "Ada Lovelace",
  email: "ada@example.com",
  password: "Secret1!",
  confirmPassword: "Secret1!",
  acceptTerms: true,
};

describe("registerSchema", () => {
  it("acepta un registro válido", () => {
    const result = registerSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("rechaza un nombre corto", () => {
    const result = registerSchema.safeParse({ ...validPayload, fullName: "A" });
    expect(result.success).toBe(false);
  });

  it("rechaza un email inválido", () => {
    const result = registerSchema.safeParse({
      ...validPayload,
      email: "no-es-email",
    });
    expect(result.success).toBe(false);
  });

  it("rechaza una contraseña débil", () => {
    const result = registerSchema.safeParse({
      ...validPayload,
      password: "secret",
      confirmPassword: "secret",
    });
    expect(result.success).toBe(false);
  });

  it("rechaza contraseñas distintas", () => {
    const result = registerSchema.safeParse({
      ...validPayload,
      confirmPassword: "OtraClave1!",
    });
    expect(result.success).toBe(false);
  });

  it("exige aceptar términos", () => {
    const result = registerSchema.safeParse({
      ...validPayload,
      acceptTerms: false,
    });
    expect(result.success).toBe(false);
  });
});
