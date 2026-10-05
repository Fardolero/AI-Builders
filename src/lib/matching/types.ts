// Tipos del dominio de matching. Oferta y deseo son el MISMO tipo de nodo
// (Publicacion con campo `tipo`), tal como exige la spec técnica §11.

export type TipoPublicacion = 'ofrezco' | 'busco';
export type Naturaleza = 'objeto' | 'servicio';
export type EstadoPublicacion = 'activa' | 'pausada' | 'vencida' | 'rechazada' | 'consumida';

/** Centroide del BARRIO/zona. Nunca un domicilio (Ley 25.326 + spec §2.1). */
export interface Zona {
  id: string;
  nombre: string;
  lat: number;
  lng: number;
}

export interface Publicacion {
  id: string;
  usuarioId: string;
  tipo: TipoPublicacion;
  titulo: string;
  descripcion: string;
  categoria: string;               // slug de la taxonomía
  queBuscaACambio?: string | null; // solo en 'ofrezco', texto libre
  zonaId: string;
  estado: EstadoPublicacion;
  creadaEn: Date;
  actualizadaEn: Date;
  venceEn?: Date | null;
  embedding?: number[] | null;     // nullable: en Fase 1 puede no estar poblado
}

export interface PerfilMatching {
  usuarioId: string;
  nombrePublico: string;          // "Pedro G." (inicial del apellido)
  zonaId: string;
  cuentaConfirmada: boolean;      // teléfono o email confirmado (nunca "identidad verificada")
  suspendido: boolean;
  intercambiosCompletados: number;
  creditosVecinales: number;      // SOLO para ordenar/filtrar, nunca para el %
  categoriasHistorial: string[];  // categorías donde publicó o completó intercambios
  ultimaActividad: Date;
}

export interface Descarte {
  usuarioId: string;
  claveSugerencia: string;
  descartadoEn: Date;
  porcentajeAlDescartar: number;
}

export interface IntercambioAbierto {
  publicacionIds: string[];
  usuarioIds: string[];
}

export interface ContextoMatching {
  ahora: Date;
  zonas: Map<string, Zona>;
  perfiles: Map<string, PerfilMatching>;
  publicaciones: Publicacion[];
  /** Pares [quienBloquea, bloqueado]. Se aplica en ambos sentidos. */
  bloqueos: Array<[string, string]>;
  descartes: Descarte[];
  intercambiosAbiertos: IntercambioAbierto[];
  /** publicacionId -> cantidad de propuestas abiertas sobre esa oferta */
  propuestasAbiertasPorOferta: Map<string, number>;
}

export type FuenteRelevancia = 'lexica' | 'semantica' | 'hibrida';

export interface DesgloseScore {
  relevancia: number;             // 0-1
  fuenteRelevancia: FuenteRelevancia;
  terminosCoincidentes: string[];
  categoria: number;              // 0-1
  naturalezaCruzada: boolean;
  proximidad: number;             // 0-1 (solo ranking)
  distanciaKm: number;
  frescura: number;               // 0-1 (solo ranking)
  congestion: number;             // 0-1 (solo ranking)
}

/** Arista dirigida: `deseaUsuarioId` aceptaría la oferta `ofrezcoId` de `ofreceUsuarioId`. */
export interface AristaInteres {
  buscoId: string;                // id del "busco" o `${ofertaId}#a-cambio` (virtual)
  buscoVirtual: boolean;
  ofrezcoId: string;
  deseaUsuarioId: string;
  ofreceUsuarioId: string;
  compat: number;                 // 0-1, lo que se muestra como %
  porcentaje: number;             // entero 0-100
  rankScore: number;              // compat * proximidad * frescura * congestion
  desglose: DesgloseScore;
}

export type TipoSugerencia =
  | 'tienen_lo_que_buscas'
  | 'buscan_lo_que_ofreces'
  | 'match_mutuo'
  | 'ciclo';

export type Confianza = 'alta' | 'media' | 'baja';

export interface Sugerencia {
  clave: string;                  // estable, para descartes e idempotencia
  tipo: TipoSugerencia;
  porcentaje: number;
  confianza: Confianza;
  rankScore: number;
  contrapartes: string[];         // usuarioIds (sin el propio)
  aristas: AristaInteres[];
  publicacionesPropias: string[];
}

export interface Ciclo {
  clave: string;
  usuarios: string[];             // en orden: usuarios[i] recibe de usuarios[i+1]
  aristas: AristaInteres[];
  porcentaje: number;
  rankScore: number;
}

export interface SugerenciaDemanda {
  clave: string;
  usuarioId: string;
  etiqueta: string;               // "bicicleta"
  categoria: string;
  vecinosBuscando: number;        // distintos, >= kAnonimato
  ofertasDisponibles: number;
  ambito: 'tu_barrio' | 'cerca';
  puntaje: number;
  prioridadUsuario: number;
  mensaje: string;
  deepLink: string;
}
