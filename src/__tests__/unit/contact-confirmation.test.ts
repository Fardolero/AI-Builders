import { describe, expect, it } from "vitest";
import { contactConfirmationFlags } from "@/components/trocar/contact-confirmed-badge";

describe("contactConfirmationFlags", () => {
  it("no marca contacto confirmado si no hay fecha", () => {
    expect(contactConfirmationFlags(null)).toEqual({
      emailConfirmed: false,
      phoneConfirmed: false,
    });
    expect(
      contactConfirmationFlags({
        email_confirmed_at: null,
        phone_confirmed_at: null,
      }),
    ).toEqual({
      emailConfirmed: false,
      phoneConfirmed: false,
    });
  });

  it("usa la confirmación real de email o teléfono", () => {
    expect(
      contactConfirmationFlags({ email_confirmed_at: "2026-09-01T00:00:00Z" }),
    ).toEqual({
      emailConfirmed: true,
      phoneConfirmed: false,
    });
    expect(
      contactConfirmationFlags({ phone_confirmed_at: "2026-09-01T00:00:00Z" }),
    ).toEqual({
      emailConfirmed: false,
      phoneConfirmed: true,
    });
  });
});
