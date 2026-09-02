import { describe, expect, it } from "vitest";
import { createPostSchema } from "@/lib/validations/post";

describe("createPostSchema", () => {
  it("acepta un payload válido", () => {
    const result = createPostSchema.safeParse({
      title: "Hola mundo",
      content: "Contenido",
      published: true,
    });
    expect(result.success).toBe(true);
  });

  it("rechaza un título corto", () => {
    const result = createPostSchema.safeParse({
      title: "Hi",
      content: "Contenido",
    });
    expect(result.success).toBe(false);
  });
});
