import type { SupabaseClient } from "@supabase/supabase-js";
import { contactConfirmationFlags } from "@/components/trocar/contact-confirmed-badge";

const hidden = { emailConfirmed: false, phoneConfirmed: false };

export async function loadContactConfirmation(
  supabase: SupabaseClient,
  userId: string,
) {
  const { data, error } = await supabase
    .from("profiles")
    .select("email_confirmed_at, phone_confirmed_at")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return hidden;
  return contactConfirmationFlags(data);
}
