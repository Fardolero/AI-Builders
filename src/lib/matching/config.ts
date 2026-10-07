// Configuración del motor de match. Todo valor que va a iterar con datos del
// piloto vive acá (nunca hardcodeado en la lógica). Versionar con ALGO_VERSION.

export const ALGO_VERSION = 'match-v1.0.0';

export interface MatchConfig {
  // --- Relevancia de contenido ---
  pesoTerminoPrincipal: number;   // peso del primer término informativo del título ("busco GUITARRA ...")
  pesoTerminoDescripcion: number; // peso de términos que solo aparecen en la descripción del "busco"
  pesoNumero: number;             // peso de tokens numéricos (rodado 26, talle 38)
  factorCoincidenciaEnDescripcion: number; // si el término del busco matchea solo en la descripción de la oferta
  umbralTrigramas: number;        // similitud mínima para aceptar un typo ("gitarra" ~ "guitarra")
  valorTypoMinimo: number;        // valor de un typo justo en el umbral; escala lineal hasta 1
  semantica: {
    peso: number;                 // peso de embeddings en la mezcla híbrida
    cosenoPiso: number;           // coseno que se considera 0% (calibrar por modelo de embeddings)
    cosenoTecho: number;          // coseno que se considera 100%
  };
  relevanciaMinima: number;       // debajo de esto no existe arista (0-1)

  // --- Categoría y naturaleza ---
  pesoCategoria: number;          // porción del % que depende de la categoría (0-1)
  categoriaDesconocida: number;   // valor de categoría para "qué busca a cambio" (texto libre sin categoría)
  penalizacionNaturaleza: number; // multiplicador si se cruza objeto <-> servicio

  // --- Ranking (NO afecta el %) ---
  distanciaPlenaKm: number;       // hasta acá la proximidad vale 1
  semividaKm: number;             // cada X km extra la proximidad cae a la mitad
  radioMaximoKm: number;          // más allá no se sugiere (trueque hiperlocal)
  frescuraPlenaDias: number;
  frescuraPisoDias: number;
  frescuraPiso: number;
  propuestasParaCongestion: number; // si una oferta ya tiene N propuestas abiertas, baja en el ranking
  factorCongestion: number;
  bonusReciprocidad: number;      // multiplicador de ranking para match mutuo
  factorUnidireccional: number;   // multiplicador de ranking si solo una parte quiere algo (cierra menos)

  // --- Dashboard ---
  porcentajeMinimoDashboard: number;
  porcentajeAlta: number;         // >= esto: notificación inmediata
  porcentajeMedia: number;        // >= esto: digest diario
  topK: number;
  maxPorContraparte: number;
  maxPorPublicacionPropia: number;
  diasEnfriamientoDescarte: number;
  mejoraParaReaparecer: number;   // puntos porcentuales que debe subir un match descartado para volver

  // --- Ciclos (triangulación) ---
  ciclosHabilitados: boolean;
  largoMaximoCiclo: 2 | 3 | 4;
  porcentajeMinimoAristaCiclo: number;
  maxAristasSalientesPorNodo: number; // acota la búsqueda
  factorLargoCiclo: Record<number, number>;
  completadosMinimosCiclosLargos: number; // umbral de reputación para ciclos de largo >= 3

  // --- Demanda zonal ---
  demanda: {
    habilitada: boolean;
    radioKm: number;
    ventanaDias: number;
    kAnonimato: number;           // mínimo de vecinos DISTINTOS para mostrar una demanda
    similitudCluster: number;
    umbralCobertura: number;      // compat mínima para considerar que una oferta "cubre" la demanda
    maxSugerenciasPorUsuario: number;
    diasEntrePush: number;
    presupuestoPushPorZonaPorDia: number;
    maxCompletadosParaPush: number; // solo se notifica por push a quienes cerraron pocos trueques
    tramosPrioridad: Array<{ hastaCompletados: number; peso: number }>;
    afinidadMismaCategoria: number;
    afinidadAdyacente: number;
    afinidadBase: number;
  };
}

export const CONFIG_DEFAULT: MatchConfig = {
  pesoTerminoPrincipal: 2,
  pesoTerminoDescripcion: 0.5,
  pesoNumero: 0.5,
  factorCoincidenciaEnDescripcion: 0.7,
  umbralTrigramas: 0.5,
  valorTypoMinimo: 0.6,
  semantica: { peso: 0.6, cosenoPiso: 0.3, cosenoTecho: 0.8 },
  relevanciaMinima: 0.2,

  pesoCategoria: 0.2,
  categoriaDesconocida: 0.5,
  penalizacionNaturaleza: 0.6,

  distanciaPlenaKm: 1.5,
  semividaKm: 3,
  radioMaximoKm: 10,
  frescuraPlenaDias: 14,
  frescuraPisoDias: 60,
  frescuraPiso: 0.5,
  propuestasParaCongestion: 3,
  factorCongestion: 0.8,
  bonusReciprocidad: 1.15,
  factorUnidireccional: 0.8,

  porcentajeMinimoDashboard: 50,
  porcentajeAlta: 75,
  porcentajeMedia: 60,
  topK: 6,
  maxPorContraparte: 2,
  maxPorPublicacionPropia: 2,
  diasEnfriamientoDescarte: 30,
  mejoraParaReaparecer: 15,

  ciclosHabilitados: true,
  largoMaximoCiclo: 3,
  porcentajeMinimoAristaCiclo: 60,
  maxAristasSalientesPorNodo: 10,
  factorLargoCiclo: { 2: 1, 3: 0.9, 4: 0.8 },
  completadosMinimosCiclosLargos: 0, // en el piloto nadie tiene historial: subir a 1 cuando haya datos

  demanda: {
    habilitada: true,
    radioKm: 3,
    ventanaDias: 30,
    kAnonimato: 3,
    similitudCluster: 0.5,
    umbralCobertura: 0.5,
    maxSugerenciasPorUsuario: 3,
    diasEntrePush: 7,
    presupuestoPushPorZonaPorDia: 20,
    maxCompletadosParaPush: 2,
    tramosPrioridad: [
      { hastaCompletados: 0, peso: 1 },
      { hastaCompletados: 2, peso: 0.7 },
      { hastaCompletados: 5, peso: 0.4 },
      { hastaCompletados: Infinity, peso: 0.2 },
    ],
    afinidadMismaCategoria: 1,
    afinidadAdyacente: 0.7,
    afinidadBase: 0.4,
  },
};

export function crearConfig(overrides: Partial<MatchConfig> = {}): MatchConfig {
  return {
    ...CONFIG_DEFAULT,
    ...overrides,
    semantica: { ...CONFIG_DEFAULT.semantica, ...(overrides.semantica ?? {}) },
    demanda: { ...CONFIG_DEFAULT.demanda, ...(overrides.demanda ?? {}) },
  };
}
