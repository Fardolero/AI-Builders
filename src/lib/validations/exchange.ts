import { z } from "zod";

export const proposeExchangeSchema = z.object({
  postId: z.string().uuid(),
  offerPostId: z.string().uuid().optional().nullable(),
  offerText: z
    .string()
    .trim()
    .min(1, "Contá qué ofrecés")
    .min(5, "Describí un poco más tu oferta")
    .max(400, "Máximo 400 caracteres"),
});

export type ProposeExchangeValues = z.infer<typeof proposeExchangeSchema>;

export const exchangeMessageSchema = z.object({
  exchangeId: z.string().uuid(),
  body: z
    .string()
    .trim()
    .min(1, "Escribí un mensaje")
    .max(500, "Máximo 500 caracteres"),
});

export const counterOfferSchema = z.object({
  exchangeId: z.string().uuid(),
  counterText: z
    .string()
    .trim()
    .min(1, "Contá la contraoferta")
    .min(5, "Describí un poco más")
    .max(400, "Máximo 400 caracteres"),
});

export const ratingSchema = z.object({
  exchangeId: z.string().uuid(),
  stars: z.number().int().min(1).max(5),
  comment: z
    .string()
    .trim()
    .max(280, "Máximo 280 caracteres")
    .optional()
    .or(z.literal("")),
});

export type RatingFormValues = z.infer<typeof ratingSchema>;
