// @ts-nocheck
// Normalización de texto en español rioplatense: minúsculas, sin tildes (pero
// conservando la ñ), stopwords del dominio trueque, stemming liviano y sinónimos.
// Determinístico y auditable: dos textos iguales dan siempre los mismos tokens.

const STOPWORDS = new Set([
  // artículos, preposiciones, pronombres, conectores
  'a', 'al', 'algo', 'algun', 'alguna', 'alguno', 'ante', 'aun', 'bajo', 'cada', 'como', 'con', 'contra',
  'cual', 'cualquier', 'de', 'del', 'desde', 'donde', 'durante', 'e', 'el', 'ella', 'ellos', 'en', 'entre',
  'es', 'esa', 'ese', 'eso', 'esta', 'este', 'esto', 'estos', 'estas', 'hacia', 'hasta', 'hay', 'la', 'las',
  'le', 'les', 'lo', 'los', 'mas', 'me', 'mi', 'mis', 'muy', 'nada', 'ni', 'no', 'nos', 'o', 'otra', 'otro',
  'para', 'pero', 'poco', 'por', 'que', 'se', 'si', 'sin', 'sobre', 'son', 'su', 'sus', 'tambien', 'te',
  'tipo', 'tu', 'tus', 'u', 'un', 'una', 'uno', 'unas', 'unos', 'y', 'ya', 'yo', 'vos', 'bien', 'todo', 'toda',
  // verbos y muletillas del dominio trueque (no describen el bien/servicio)
  'busco', 'buscando', 'necesito', 'quiero', 'ofrezco', 'ofrece', 'trueco', 'truequeo', 'trueque', 'cambio',
  'cambiar', 'permuto', 'doy', 'tengo', 'regalo', 'intercambio', 'canje', 'canjeo', 'vendo', 'favor',
  'usado', 'usada', 'usados', 'usadas', 'nuevo', 'nueva', 'nuevos', 'nuevas', 'buen', 'buena', 'bueno',
  'estado', 'impecable', 'uso', 'casi', 'excelente', 'funciona', 'funcionando', 'anda', 'perfecto',
  'hola', 'vecinos', 'vecino', 'gracias', 'urgente', 'ir', 'usar', 'poder', 'sea',
]);

// Grupos de sinónimos. El PRIMER término de cada grupo es el canónico y el que
// se muestra al usuario (ej. en "los vecinos están buscando bicicleta").
const GRUPOS_SINONIMOS: string[][] = [
  ['bicicleta', 'bici', 'rodado', 'mountain', 'playera'],
  ['computadora', 'compu', 'notebook', 'laptop', 'pc', 'netbook'],
  ['celular', 'telefono', 'movil', 'smartphone', 'cel'],
  ['heladera', 'refrigerador', 'nevera'],
  ['lavarropas', 'lavadora', 'lavarropa'],
  ['cochecito', 'carrito'],
  ['remera', 'camiseta', 'chomba'],
  ['zapatilla', 'zapatillas', 'championes'],
  ['campera', 'chaqueta', 'abrigo'],
  ['clase', 'curso', 'leccion', 'profe', 'profesor', 'profesora', 'tutoria', 'apoyo'],
  ['ingles', 'english'],
  ['guitarra', 'criolla'],
  ['plomero', 'plomeria', 'sanitarista', 'caño'],
  ['electricista', 'electricidad'],
  ['jardineria', 'jardinero', 'poda', 'parquizacion', 'cesped'],
  ['arreglo', 'reparacion', 'reparar', 'arreglar', 'service'],
  ['mueble', 'muebles', 'mobiliario'],
  ['silla', 'banqueta'],
  ['juguete', 'juguetes'],
  ['libro', 'novela'],
  ['taladro', 'atornillador'],
  ['costura', 'modista', 'dobladillo', 'coser'],
  ['peluqueria', 'peluquero', 'peluquera'],
];

/** Normaliza: minúsculas, sin tildes (conserva ñ), solo [a-z0-9ñ] y espacios. */
export function normalizar(texto: string): string {
  return (texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/ñ/g, 'ñ')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ]+/g, ' ')
    .trim();
}

/**
 * Stemming liviano para plurales y vocal final, suficiente para que
 * "muebles"/"mueble", "profesores"/"profesor", "clases"/"clase",
 * "reparaciones"/"reparacion", "lapices"/"lapiz" colapsen al mismo token.
 */
export function stem(token: string): string {
  let t = token;
  if (t.length <= 3 || /^\d+$/.test(t)) return t;
  if (t.endsWith('iones')) t = t.slice(0, -5) + 'ion';
  else if (t.endsWith('ces')) t = t.slice(0, -3) + 'z';
  else if (t.endsWith('s')) t = t.slice(0, -1);
  if (t.length > 3 && t.endsWith('e') && !/[aeiou]/.test(t[t.length - 2])) t = t.slice(0, -1);
  return t;
}

const CANONICO = new Map<string, string>();   // stem -> stem canónico
const VISIBLE = new Map<string, string>();    // stem canónico -> palabra para mostrar
for (const grupo of GRUPOS_SINONIMOS) {
  const canon = stem(normalizar(grupo[0]));
  VISIBLE.set(canon, grupo[0]);
  for (const palabra of grupo) CANONICO.set(stem(normalizar(palabra)), canon);
}

export function canonizar(tokenStem: string): string {
  return CANONICO.get(tokenStem) ?? tokenStem;
}

export interface TokenInfo {
  token: string;      // canónico (stem + sinónimo)
  superficie: string; // palabra normalizada original, para etiquetas
  numerico: boolean;
}

/** Tokeniza preservando el orden (el primer token informativo es el "término principal"). */
export function tokenizar(texto: string): TokenInfo[] {
  const out: TokenInfo[] = [];
  // Se separa sobre el texto original para conservar la palabra con tildes como "superficie".
  for (const original of (texto ?? '').toLowerCase().split(/[^0-9a-zñáéíóúü]+/i)) {
    for (const palabra of normalizar(original).split(' ')) {
      if (!palabra || (palabra.length < 2 && !/^\d$/.test(palabra))) continue;
      if (STOPWORDS.has(palabra)) continue;
      const numerico = /^\d+$/.test(palabra);
      out.push({ token: canonizar(stem(palabra)), superficie: original || palabra, numerico });
    }
  }
  return out;
}

/** Palabra legible para un token canónico ("bicicleta" para "bici"/"rodado"). */
export function etiquetaVisible(token: string, superficieFallback: string): string {
  return VISIBLE.get(token) ?? superficieFallback;
}

const cacheTrigramas = new Map<string, Set<string>>();
export function trigramas(token: string): Set<string> {
  let s = cacheTrigramas.get(token);
  if (s) return s;
  s = new Set<string>();
  const t = `  ${token} `;
  for (let i = 0; i < t.length - 2; i++) s.add(t.slice(i, i + 3));
  if (cacheTrigramas.size > 50_000) cacheTrigramas.clear(); // cota de memoria
  cacheTrigramas.set(token, s);
  return s;
}

/** Jaccard de trigramas (mismo criterio que pg_trgm.similarity). */
export function similitudTrigramas(a: string, b: string): number {
  if (a === b) return 1;
  const ta = trigramas(a);
  const tb = trigramas(b);
  let inter = 0;
  for (const g of ta) if (tb.has(g)) inter++;
  return inter / (ta.size + tb.size - inter);
}
