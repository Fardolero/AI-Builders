import { describe, expect, it } from "vitest";
import { loginSchema } from "@/lib/validations/login";

const validPayload = {
  email: "ada@example.com",
  password: "Secret1!",
};

describe("loginSchema", () => {
  it("acepta credenciales con formato válido", () => {
    const result = loginSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("rechaza un email vacío", () => {
    const result = loginSchema.safeParse({ ...validPayload, email: "   " });
    expect(result.success).toBe(false);
  });

  it("rechaza un email inválido", () => {
    const result = loginSchema.safeParse({
      ...validPayload,
      email: "no-es-email",
    });
    expect(result.success).toBe(false);
  });

  it("rechaza una contraseña vacía", () => {
    const result = loginSchema.safeParse({ ...validPayload, password: "" });
    expect(result.success).toBe(false);
  });
});
