import { z } from "zod";

export const createPostSchema = z.object({
  title: z.string().trim().min(3, "El título debe tener al menos 3 caracteres").max(120),
  content: z.string().trim().min(1, "El contenido es obligatorio").max(10_000),
  published: z.boolean().optional().default(false),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
