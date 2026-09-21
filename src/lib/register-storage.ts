import { z } from "zod";

export const REGISTERED_USERS_STORAGE_KEY = "ai-builders:registered-users";

export const registeredUserSchema = z.object({
  id: z.string().min(1),
  fullName: z.string().min(1),
  email: z.string().min(1),
  createdAt: z.string().min(1),
});

export type RegisteredUser = z.infer<typeof registeredUserSchema>;

export type NewRegisteredUser = Pick<RegisteredUser, "fullName" | "email">;

function getStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

export function readRegisteredUsers(): RegisteredUser[] {
  const storage = getStorage();
  if (!storage) {
    return [];
  }

  const raw = storage.getItem(REGISTERED_USERS_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    const result = z.array(registeredUserSchema).safeParse(parsed);
    return result.success ? result.data : [];
  } catch {
    return [];
  }
}

export function persistRegisteredUser(input: NewRegisteredUser): RegisteredUser {
  const users = readRegisteredUsers();
  const email = input.email.trim().toLowerCase();

  if (users.some((user) => user.email.toLowerCase() === email)) {
    throw new Error("Ya existe una cuenta registrada con este correo.");
  }

  const nextUser: RegisteredUser = {
    id: crypto.randomUUID(),
    fullName: input.fullName.trim(),
    email,
    createdAt: new Date().toISOString(),
  };

  const nextUsers = [...users, nextUser];
  const storage = getStorage();

  if (!storage) {
    throw new Error("El almacenamiento local no está disponible.");
  }

  storage.setItem(REGISTERED_USERS_STORAGE_KEY, JSON.stringify(nextUsers));
  return nextUser;
}
