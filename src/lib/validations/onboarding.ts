import { z } from "zod";
import { INTEREST_OPTIONS, PILOT_BARRIOS } from "@/constants/routes";

export const onboardingSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(80)
    .optional()
    .or(z.literal("")),
  barrio: z.enum(PILOT_BARRIOS, {
    message: "Elegí un barrio piloto",
  }),
  bio: z
    .string()
    .trim()
    .max(280, "La bio puede tener hasta 280 caracteres")
    .optional()
    .or(z.literal("")),
  interests: z.array(z.enum(INTEREST_OPTIONS)).max(8),
});

export type OnboardingFormValues = z.infer<typeof onboardingSchema>;

export const ONBOARDING_DEFAULT_VALUES: OnboardingFormValues = {
  fullName: "",
  barrio: PILOT_BARRIOS[0],
  bio: "",
  interests: [],
};
