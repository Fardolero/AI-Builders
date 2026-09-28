import { describe, expect, it } from "vitest";
import { onboardingSchema } from "@/lib/validations/onboarding";
import { createPostSchema } from "@/lib/validations/post-trocar";

describe("onboardingSchema", () => {
  it("acepta un barrio piloto válido", () => {
    const result = onboardingSchema.safeParse({
      barrio: "Centro MdP",
      bio: "Presto herramientas",
      interests: [],
    });
    expect(result.success).toBe(true);
  });

  it("rechaza un barrio fuera de la lista", () => {
    const result = onboardingSchema.safeParse({
      barrio: "Recoleta",
      bio: "",
      interests: [],
    });
    expect(result.success).toBe(false);
  });
});

describe("createPostSchema", () => {
  it("acepta una publicación válida", () => {
    const result = createPostSchema.safeParse({
      kind: "objeto",
      title: "Taladro",
      description: "Taladro percutor en buen estado",
      lookingFor: "Plantas o ayuda",
      barrio: "Chapadmalal",
    });
    expect(result.success).toBe(true);
  });

  it("rechaza un título corto", () => {
    const result = createPostSchema.safeParse({
      kind: "servicio",
      title: "Hi",
      description: "Descripción suficientemente larga",
      lookingFor: "Algo",
      barrio: "Miramar",
    });
    expect(result.success).toBe(false);
  });
});
