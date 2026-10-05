// Taxonomía de categorías del piloto. Las categorías prohibidas (spec §4) no
// existen acá: una publicación prohibida nunca llega al motor.

import type { Naturaleza } from './types';

export interface Categoria {
  slug: string;
  nombre: string;
  naturaleza: Naturaleza;
  grupo: string; // categorías del mismo grupo son "adyacentes"
}

export const CATEGORIAS: Record<string, Categoria> = {
  hogar:        { slug: 'hogar', nombre: 'Hogar y deco', naturaleza: 'objeto', grupo: 'casa' },
  muebles:      { slug: 'muebles', nombre: 'Muebles', naturaleza: 'objeto', grupo: 'casa' },
  electro:      { slug: 'electro', nombre: 'Electrodomésticos', naturaleza: 'objeto', grupo: 'casa' },
  tecnologia:   { slug: 'tecnologia', nombre: 'Tecnología', naturaleza: 'objeto', grupo: 'tecno' },
  ropa:         { slug: 'ropa', nombre: 'Ropa y calzado', naturaleza: 'objeto', grupo: 'ropa' },
  ninos:        { slug: 'ninos', nombre: 'Niños y bebés', naturaleza: 'objeto', grupo: 'ninos' },
  juguetes:     { slug: 'juguetes', nombre: 'Juguetes', naturaleza: 'objeto', grupo: 'ninos' },
  libros:       { slug: 'libros', nombre: 'Libros', naturaleza: 'objeto', grupo: 'cultura' },
  musica:       { slug: 'musica', nombre: 'Instrumentos y música', naturaleza: 'objeto', grupo: 'cultura' },
  deportes:     { slug: 'deportes', nombre: 'Deportes y bicis', naturaleza: 'objeto', grupo: 'aire_libre' },
  jardin:       { slug: 'jardin', nombre: 'Plantas y jardín', naturaleza: 'objeto', grupo: 'aire_libre' },
  herramientas: { slug: 'herramientas', nombre: 'Herramientas', naturaleza: 'objeto', grupo: 'hacer' },
  clases:       { slug: 'clases', nombre: 'Clases y apoyo escolar', naturaleza: 'servicio', grupo: 'saberes' },
  oficios:      { slug: 'oficios', nombre: 'Arreglos y oficios', naturaleza: 'servicio', grupo: 'hacer_servicio' },
  cuidado:      { slug: 'cuidado', nombre: 'Cuidado personal (no salud)', naturaleza: 'servicio', grupo: 'personas' },
  cocina:       { slug: 'cocina', nombre: 'Cocina casera', naturaleza: 'servicio', grupo: 'personas' },
  otros:        { slug: 'otros', nombre: 'Otros', naturaleza: 'objeto', grupo: 'otros' },
};

/** Adyacencias explícitas entre grupos distintos (simétricas). */
const ADYACENCIAS: Array<[string, string]> = [
  ['herramientas', 'oficios'],
  ['musica', 'clases'],
  ['ninos', 'ropa'],
  ['deportes', 'ninos'],
];

const ady = new Set<string>();
for (const [a, b] of ADYACENCIAS) { ady.add(`${a}|${b}`); ady.add(`${b}|${a}`); }

export function naturalezaDe(slug: string): Naturaleza {
  return CATEGORIAS[slug]?.naturaleza ?? 'objeto';
}

/** 1 = misma categoría · 0.6 = adyacente · 0 = distinta. */
export function similitudCategoria(a: string, b: string): number {
  if (a === b) return 1;
  const ca = CATEGORIAS[a];
  const cb = CATEGORIAS[b];
  if (!ca || !cb) return 0;
  if (ca.grupo === cb.grupo || ady.has(`${a}|${b}`)) return 0.6;
  return 0;
}
