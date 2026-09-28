/** Mapeos entre labels Trocar (UI/DB) y slugs/ids del motor. */

export const BARRIO_A_ZONA: Record<string, string> = {
  "Centro MdP": "centro-mdp",
  "Playa Grande": "playa-grande",
  Chapadmalal: "chapadmalal",
  "Santa Clara del Mar": "santa-clara",
  Miramar: "miramar",
};

export const CATEGORIA_A_SLUG: Record<string, string> = {
  Hogar: "hogar",
  "Ropa y calzado": "ropa",
  Deportes: "deportes",
  Herramientas: "herramientas",
  Libros: "libros",
  Plantas: "jardin",
  Tecnología: "tecnologia",
  Clases: "clases",
  Otros: "otros",
};

export function barrioAZonaId(barrio: string | null | undefined): string {
  if (!barrio) return "centro-mdp";
  return BARRIO_A_ZONA[barrio] ?? "centro-mdp";
}

export function categoriaASlug(category: string | null | undefined): string {
  if (!category) return "otros";
  return CATEGORIA_A_SLUG[category] ?? "otros";
}

export function nombrePublico(fullName: string | null | undefined): string {
  const parts = (fullName ?? "Vecino").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Vecino";
  const first = parts[0] ?? "Vecino";
  if (parts.length === 1) return first;
  const last = parts[parts.length - 1] ?? "";
  const initial = last.charAt(0).toUpperCase() || "X";
  return `${first} ${initial}.`;
}

export function mapPostEstado(
  status: string,
): "activa" | "pausada" | "vencida" | "rechazada" | "consumida" {
  switch (status) {
    case "activa":
      return "activa";
    case "pausada":
      return "pausada";
    case "intercambiada":
      return "consumida";
    case "moderado":
      return "rechazada";
    default:
      return "pausada";
  }
}

export const EXCHANGE_OPEN = [
  "pending",
  "accepted",
  "countered",
  "coordinating",
] as const;
