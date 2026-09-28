import { beforeEach, describe, expect, it, vi } from "vitest";

const signUp = vi.fn();
const signInWithPassword = vi.fn();
const signOut = vi.fn();
const getCurrentUserAndProfile = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      signUp,
      signInWithPassword,
      signOut,
    },
  })),
}));

vi.mock("@/lib/supabase/env", () => ({
  isSupabaseConfigured: () => true,
}));

vi.mock("@/lib/trocar/profile", async () => {
  const actual = await vi.importActual<typeof import("@/lib/trocar/profile")>(
    "@/lib/trocar/profile",
  );
  return {
    ...actual,
    getCurrentUserAndProfile: (...args: unknown[]) =>
      getCurrentUserAndProfile(...args),
  };
});

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

const validRegister = {
  fullName: "Ada Lovelace",
  email: "ada@example.com",
  password: "Secret1!",
  confirmPassword: "Secret1!",
  acceptTerms: true,
};

describe("auth actions", () => {
  beforeEach(() => {
    signUp.mockReset();
    signInWithPassword.mockReset();
    signOut.mockReset();
    getCurrentUserAndProfile.mockReset();
    getCurrentUserAndProfile.mockResolvedValue({
      supabase: {},
      user: { id: "user-1" },
      profile: { onboarding_completed_at: null },
    });
  });

  it("registra con supabase.auth.signUp", async () => {
    signUp.mockResolvedValue({ data: { session: null }, error: null });
    const { signUpAction } = await import("@/app/actions/auth");

    const result = await signUpAction(validRegister);

    expect(signUp).toHaveBeenCalledWith({
      email: "ada@example.com",
      password: "Secret1!",
      options: expect.objectContaining({
        data: { full_name: "Ada Lovelace" },
      }),
    });
    expect(result.success).toMatch(/Cuenta creada/i);
  });

  it("inicia sesión con supabase.auth.signInWithPassword", async () => {
    signInWithPassword.mockResolvedValue({ error: null });
    const { signInWithPasswordAction } = await import("@/app/actions/auth");

    await expect(
      signInWithPasswordAction({
        email: "ada@example.com",
        password: "Secret1!",
      }),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "ada@example.com",
      password: "Secret1!",
    });
  });

  it("devuelve un error si las credenciales son inválidas", async () => {
    signInWithPassword.mockResolvedValue({
      error: { message: "Invalid login credentials" },
    });
    const { signInWithPasswordAction } = await import("@/app/actions/auth");

    const result = await signInWithPasswordAction({
      email: "ada@example.com",
      password: "Wrong1!",
    });

    expect(result.error).toMatch(/correo o la contraseña/i);
  });

  it("cierra sesión con supabase.auth.signOut", async () => {
    signOut.mockResolvedValue({ error: null });
    const { signOutAction } = await import("@/app/actions/auth");

    await expect(signOutAction()).rejects.toThrow("NEXT_REDIRECT");
    expect(signOut).toHaveBeenCalled();
  });
});
