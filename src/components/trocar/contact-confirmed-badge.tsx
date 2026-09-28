export function contactConfirmationFlags(
  source: {
    email_confirmed_at?: string | null;
    phone_confirmed_at?: string | null;
  } | null | undefined,
) {
  return {
    emailConfirmed: Boolean(source?.email_confirmed_at),
    phoneConfirmed: Boolean(source?.phone_confirmed_at),
  };
}

export function ContactConfirmedBadge({
  emailConfirmed,
  phoneConfirmed,
}: {
  emailConfirmed?: boolean;
  phoneConfirmed?: boolean;
}) {
  if (phoneConfirmed) {
    return (
      <span className="inline-flex items-center rounded-full border border-trocar-accent/40 bg-trocar-mist-deep px-2.5 py-0.5 text-xs font-semibold text-trocar-accent">
        Teléfono confirmado
      </span>
    );
  }
  if (emailConfirmed) {
    return (
      <span className="inline-flex items-center rounded-full border border-trocar-accent/40 bg-trocar-mist-deep px-2.5 py-0.5 text-xs font-semibold text-trocar-accent">
        Email confirmado
      </span>
    );
  }
  return null;
}
