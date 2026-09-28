"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { destinationAfterAuth, getCurrentUserAndProfile } from "@/lib/trocar/profile";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { loginSchema, type LoginFormValues } from "@/lib/validations/login";
import {
  normalizeArgentinePhone,
  otpRequestSchema,
  otpVerifySchema,
  type OtpRequestValues,
  type OtpVerifyValues,
} from "@/lib/validations/otp";
import {
  registerSchema,
  type RegisterFormValues,
} from "@/lib/validations/register";

export type AuthActionResult = {
  error: string | null;
  success?: string;
};

const MISSING_SUPABASE_CONFIG =
  "Supabase no está configurado. Añade NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local.";

function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}

function mapAuthError(message: string): string {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("already registered") ||
    normalized.includes("already been registered") ||
    normalized.includes("user already exists")
  ) {
    return "Ya existe una cuenta registrada con este correo.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Confirma tu correo antes de iniciar sesión.";
  }

  if (
    normalized.includes("invalid login") ||
    normalized.includes("invalid credentials")
  ) {
    return "El correo o la contraseña no son correctos.";
  }

  if (normalized.includes("expired") || normalized.includes("otp_expired")) {
    return "El código venció. Pedí uno nuevo.";
  }

  if (
    normalized.includes("invalid otp") ||
    normalized.includes("token is invalid") ||
    normalized.includes("token has expired")
  ) {
    return "El código no es correcto.";
  }

  if (
    normalized.includes("phone provider") ||
    normalized.includes("sms") ||
    normalized.includes("unsupported phone")
  ) {
    return "El ingreso por teléfono todavía no está habilitado. Usá tu correo.";
  }

  if (normalized.includes("rate limit") || normalized.includes("too many")) {
    return "Esperá un momento antes de pedir otro código.";
  }

  return message;
}

async function redirectAfterAuth() {
  const { profile } = await getCurrentUserAndProfile();
  revalidatePath("/", "layout");
  redirect(destinationAfterAuth(profile));
}

export async function signUpAction(
  input: RegisterFormValues,
): Promise<AuthActionResult> {
  if (!isSupabaseConfigured()) {
    return { error: MISSING_SUPABASE_CONFIG };
  }

  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Revisa los campos del formulario." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
      },
      emailRedirectTo: `${getAppUrl()}${ROUTES.authCallback}`,
    },
  });

  if (error) {
    return { error: mapAuthError(error.message) };
  }

  if (!data.session) {
    return {
      error: null,
      success:
        "Cuenta creada. Revisa tu correo para confirmar el registro e inicia sesión.",
    };
  }

  await redirectAfterAuth();
  return { error: null };
}

export async function signInWithPasswordAction(
  input: LoginFormValues,
): Promise<AuthActionResult> {
  if (!isSupabaseConfigured()) {
    return { error: MISSING_SUPABASE_CONFIG };
  }

  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Revisa el correo y la contraseña." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: mapAuthError(error.message) };
  }

  await redirectAfterAuth();
  return { error: null };
}

export async function requestOtpAction(
  input: OtpRequestValues,
): Promise<AuthActionResult> {
  if (!isSupabaseConfigured()) {
    return { error: MISSING_SUPABASE_CONFIG };
  }

  const parsed = otpRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Revisá el dato ingresado.",
    };
  }

  const supabase = await createClient();
  const destination =
    parsed.data.channel === "email"
      ? parsed.data.value.trim().toLowerCase()
      : normalizeArgentinePhone(parsed.data.value);

  if (!destination) {
    return { error: "Ingresá un celular válido." };
  }

  const { error } =
    parsed.data.channel === "email"
      ? await supabase.auth.signInWithOtp({
          email: destination,
          options: {
            shouldCreateUser: true,
            emailRedirectTo: `${getAppUrl()}${ROUTES.authCallback}`,
          },
        })
      : await supabase.auth.signInWithOtp({
          phone: destination,
          options: { shouldCreateUser: true },
        });

  if (error) {
    return { error: mapAuthError(error.message) };
  }

  const next = new URL(`${getAppUrl()}${ROUTES.loginVerify}`);
  next.searchParams.set("channel", parsed.data.channel);
  next.searchParams.set("to", destination);
  redirect(`${next.pathname}${next.search}`);
}

export async function verifyOtpAction(
  input: OtpVerifyValues,
): Promise<AuthActionResult> {
  if (!isSupabaseConfigured()) {
    return { error: MISSING_SUPABASE_CONFIG };
  }

  const parsed = otpVerifySchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Ingresá el código de 6 números." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp(
    parsed.data.channel === "email"
      ? {
          email: parsed.data.to,
          token: parsed.data.code,
          type: "email",
        }
      : {
          phone: parsed.data.to,
          token: parsed.data.code,
          type: "sms",
        },
  );

  if (error) {
    return { error: mapAuthError(error.message) };
  }

  await redirectAfterAuth();
  return { error: null };
}

export async function signInWithGoogleAction(
  nextPath?: string,
): Promise<AuthActionResult> {
  if (!isSupabaseConfigured()) {
    return { error: MISSING_SUPABASE_CONFIG };
  }

  const supabase = await createClient();
  const redirectUrl = new URL(`${getAppUrl()}${ROUTES.authCallback}`);
  if (nextPath?.startsWith("/") && !nextPath.startsWith("//")) {
    redirectUrl.searchParams.set("next", nextPath);
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectUrl.toString(),
      queryParams: {
        prompt: "select_account",
      },
    },
  });

  if (error) {
    return { error: mapAuthError(error.message) };
  }

  if (!data.url) {
    return { error: "No se pudo iniciar sesión con Google." };
  }

  redirect(data.url);
}

export async function signOutAction(): Promise<AuthActionResult | void> {
  if (!isSupabaseConfigured()) {
    return { error: MISSING_SUPABASE_CONFIG };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { error: mapAuthError(error.message) };
  }

  revalidatePath("/", "layout");
  redirect(ROUTES.home);
}
