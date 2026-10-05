import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "@/components/auth/login-form";

const signInWithPasswordAction = vi.fn();

vi.mock("@/app/actions/auth", () => ({
  signInWithPasswordAction: (...args: unknown[]) =>
    signInWithPasswordAction(...args),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    signInWithPasswordAction.mockReset();
  });

  it("mantiene el botón deshabilitado hasta que el formulario es válido", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const submit = screen.getByRole("button", { name: "Iniciar sesión" });
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText("Correo electrónico"), "ada@example.com");
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText("Contraseña"), "Secret1!");

    await waitFor(() => {
      expect(submit).toBeEnabled();
    });
  });

  it("muestra un error si las credenciales no coinciden", async () => {
    signInWithPasswordAction.mockResolvedValue({
      error: "El correo o la contraseña no son correctos.",
    });

    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText("Correo electrónico"), "ada@example.com");
    await user.type(screen.getByLabelText("Contraseña"), "Wrong1!");
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent(/correo o la contraseña/i);
    expect(signInWithPasswordAction).toHaveBeenCalledWith({
      email: "ada@example.com",
      password: "Wrong1!",
    });
  });

  it("envía las credenciales a Supabase Auth cuando el formulario es válido", async () => {
    signInWithPasswordAction.mockResolvedValue({ error: null });

    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText("Correo electrónico"), "ada@example.com");
    await user.type(screen.getByLabelText("Contraseña"), "Secret1!");
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    await waitFor(() => {
      expect(signInWithPasswordAction).toHaveBeenCalledWith({
        email: "ada@example.com",
        password: "Secret1!",
      });
    });
  });
});
