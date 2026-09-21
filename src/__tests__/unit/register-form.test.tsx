import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { RegisterForm } from "@/components/auth/register-form";
import { readRegisteredUsers } from "@/lib/register-storage";

describe("RegisterForm", () => {
  beforeEach(() => {
    window.localStorage.clear();
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
        /Acepto los términos y condiciones/i,
      ),
    );

    await waitFor(() => {
      expect(submit).toBeEnabled();
    });
  });

  it("guarda el usuario, muestra confirmación y limpia los campos", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText("Nombre completo"), "Ada Lovelace");
    await user.type(screen.getByLabelText("Correo electrónico"), "ada@example.com");
    await user.type(screen.getByLabelText("Contraseña"), "Secret1!");
    await user.type(screen.getByLabelText("Confirmar contraseña"), "Secret1!");
    await user.click(screen.getByLabelText(/Acepto los términos y condiciones/i));
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    expect(screen.getByRole("button", { name: /Guardando/i })).toBeDisabled();

    expect(
      await screen.findByRole("status", undefined, { timeout: 2_000 }),
    ).toHaveTextContent(/Cuenta creada/i);

    expect(screen.getByLabelText("Nombre completo")).toHaveValue("");
    expect(screen.getByLabelText("Correo electrónico")).toHaveValue("");
    expect(readRegisteredUsers()).toEqual([
      expect.objectContaining({
        fullName: "Ada Lovelace",
        email: "ada@example.com",
      }),
    ]);
  });
});
