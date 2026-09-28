import { z } from "zod";
import { MEETING_POINTS, PILOT_BARRIOS } from "@/constants/routes";

export const postKindSchema = z.enum(["objeto", "servicio"]);
export const postIntentSchema = z.enum(["ofrezco", "busco"]);
export const postStatusSchema = z.enum([
  "activa",
  "pausada",
  "intercambiada",
  "moderado",
]);
export const postConditionSchema = z.enum(["nuevo", "como_nuevo", "usado"]);

export const POST_CATEGORIES = [
  "Hogar",
  "Ropa y calzado",
  "Deportes",
  "Herramientas",
  "Libros",
  "Plantas",
  "Tecnología",
  "Clases",
  "Otros",
] as const;

export const PROHIBITED_KEYWORDS = [
  "medicamento",
  "medicamentos",
  "arma",
  "armas",
  "pistola",
  "documento",
  "dni",
  "pasaporte",
  "animal",
  "perro",
  "gato",
  "mascota",
  "receta",
] as const;

export function isProhibitedContent(...parts: string[]): boolean {
  const haystack = parts.join(" ").toLowerCase();
  return PROHIBITED_KEYWORDS.some((word) => haystack.includes(word));
}

const meetingPointIds = MEETING_POINTS.map((point) => point.id) as [
  (typeof MEETING_POINTS)[number]["id"],
  ...(typeof MEETING_POINTS)[number]["id"][],
];

const categoryEnum = z.enum(POST_CATEGORIES);

export const createPostSchema = z.object({
  intent: postIntentSchema,
  kind: postKindSchema,
  title: z
    .string()
    .trim()
    .min(1, "El título es obligatorio")
    .min(3, "El título debe tener al menos 3 caracteres")
    .max(80, "El título puede tener hasta 80 caracteres"),
  description: z
    .string()
    .trim()
    .min(1, "La descripción es obligatoria")
    .min(10, "Contá un poco más (mínimo 10 caracteres)")
    .max(800, "La descripción puede tener hasta 800 caracteres"),
  lookingFor: z.string().trim().max(200, "Qué buscás puede tener hasta 200 caracteres"),
  category: categoryEnum,
  condition: postConditionSchema.nullable().optional(),
  barrio: z.enum(PILOT_BARRIOS, {
    message: "Elegí un barrio",
  }),
  meetingPointId: z.enum(meetingPointIds).nullable().optional(),
  imageUrl: z.string().nullable().optional(),
});

export type CreatePostFormValues = z.infer<typeof createPostSchema>;

export const CREATE_POST_DEFAULT_VALUES: CreatePostFormValues = {
  intent: "ofrezco",
  kind: "objeto",
  title: "",
  description: "",
  lookingFor: "",
  category: "Otros",
  condition: "como_nuevo",
  barrio: PILOT_BARRIOS[0],
  meetingPointId: null,
  imageUrl: null,
};

export const updatePostStatusSchema = z.object({
  id: z.string().uuid(),
  status: postStatusSchema,
});
