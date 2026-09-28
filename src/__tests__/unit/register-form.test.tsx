import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RegisterForm } from "@/components/auth/register-form";

const signUpAction = vi.fn();

vi.mock("@/app/actions/auth", () => ({
  signUpAction: (...args: unknown[]) => signUpAction(...args),
}));

describe("RegisterForm", () => {
  beforeEach(() => {
    signUpAction.mockReset();
  });

  it("mantiene el botón deshabilitado hasta que el formulario es válido", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const submit = screen.getByRole("button", { name: "Crear cuenta" });
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText("Nombre completo"), "Ada Lovelace");
    await user.type(screen.getByLabelText("Correo electrónico"), "ada@example.com");
    await user.type(screen.getByLabelText("Contraseña"), "Secret1!");
    await user.type(screen.getByLabelText("Confirmar contraseña"), "Secret1!");
    expect(submit).toBeDisabled();

    await user.click(
      screen.getByLabelText(
        /Acepto los términos/i,
      ),
    );

    await waitFor(() => {
      expect(submit).toBeEnabled();
    });
  });

  it("crea la cuenta en Supabase, muestra confirmación y limpia los campos", async () => {
    signUpAction.mockResolvedValue({
      error: null,
      success: "Cuenta creada. Revisa tu correo para confirmar el registro e inicia sesión.",
    });

    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText("Nombre completo"), "Ada Lovelace");
    await user.type(screen.getByLabelText("Correo electrónico"), "ada@example.com");
    await user.type(screen.getByLabelText("Contraseña"), "Secret1!");
    await user.type(screen.getByLabelText("Confirmar contraseña"), "Secret1!");
    await user.click(screen.getByLabelText(/Acepto los términos/i));
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    expect(
      await screen.findByRole("status"),
    ).toHaveTextContent(/Cuenta creada/i);

    expect(screen.getByLabelText("Nombre completo")).toHaveValue("");
    expect(screen.getByLabelText("Correo electrónico")).toHaveValue("");
    expect(signUpAction).toHaveBeenCalledWith({
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      password: "Secret1!",
      confirmPassword: "Secret1!",
      acceptTerms: true,
    });
  });
});
