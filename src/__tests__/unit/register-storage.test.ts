import { beforeEach, describe, expect, it } from "vitest";
import {
  persistRegisteredUser,
  readRegisteredUsers,
  REGISTERED_USERS_STORAGE_KEY,
} from "@/lib/register-storage";

describe("register-storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("añade usuarios sin sobrescribir los anteriores", () => {
    persistRegisteredUser({ fullName: "Ada Lovelace", email: "ada@example.com" });
    persistRegisteredUser({ fullName: "Alan Turing", email: "alan@example.com" });

    const users = readRegisteredUsers();
    expect(users).toHaveLength(2);
    expect(users.map((user) => user.email)).toEqual([
      "ada@example.com",
      "alan@example.com",
    ]);
    expect(window.localStorage.getItem(REGISTERED_USERS_STORAGE_KEY)).toContain(
      "alan@example.com",
    );
  });

  it("rechaza un correo duplicado", () => {
    persistRegisteredUser({ fullName: "Ada Lovelace", email: "ada@example.com" });
    expect(() =>
      persistRegisteredUser({ fullName: "Ada", email: "ADA@example.com" }),
    ).toThrow(/correo/);
  });
});
