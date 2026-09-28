import {
  Bike,
  BookOpen,
  GraduationCap,
  Home,
  Laptop,
  LayoutGrid,
  Leaf,
  Package,
  Wrench,
  type LucideIcon,
} from "lucide-react";

/** Iconos Lucide compartidos en Trocar (MIT). */
export const TROCAR_ICONS = {
  all: LayoutGrid,
  home: Home,
  bike: Bike,
  wrench: Wrench,
  book: BookOpen,
  leaf: Leaf,
  laptop: Laptop,
  graduation: GraduationCap,
  package: Package,
} as const satisfies Record<string, LucideIcon>;

export type TrocarIconId = keyof typeof TROCAR_ICONS;

export function getTrocarIcon(id: string | undefined): LucideIcon {
  if (id && id in TROCAR_ICONS) {
    return TROCAR_ICONS[id as TrocarIconId];
  }
  return LayoutGrid;
}
