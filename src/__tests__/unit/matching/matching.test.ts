import { describe, expect, it } from "vitest";
import { crearConfig } from "@/lib/matching/config";
import {
  construirGrafo,
  sugerenciasDashboard,
  matchesDePublicacion,
} from "@/lib/matching/engine";
import { encontrarCiclos, asignarCiclos } from "@/lib/matching/cycles";
import {
  sugerenciasDemanda,
  planificarPushDemanda,
} from "@/lib/matching/demand";
import { calcularRegion, presentarSugerencia } from "@/lib/matching/index";
import { normalizar, stem, tokenizar } from "@/lib/matching/text";
import { AHORA, ctx, perfil, pub } from "./fixtures";

const cfg = crearConfig();
const arista = (
  c: ReturnType<typeof ctx>,
  buscoId: string,
  ofrezcoId: string,
) =>
  construirGrafo(c, cfg).aristas.find(
    (a) => a.buscoId === buscoId && a.ofrezcoId === ofrezcoId,
  );

describe("texto", () => {
  it("normaliza tildes pero conserva ñ", () => {
    expect(normalizar("Canción ÑANDÚ, café!")).toBe("cancion ñandu cafe");
  });
  it("stemming colapsa plurales", () => {
    for (const [a, b] of [
      ["muebles", "mueble"],
      ["profesores", "profesor"],
      ["clases", "clase"],
      ["reparaciones", "reparacion"],
      ["lapices", "lapiz"],
    ] as const) {
      expect(stem(a)).toBe(stem(b));
    }
  });
  it("sinónimos y stopwords del dominio", () => {
    expect(
      tokenizar("Busco bici usada en buen estado").map((t) => t.token),
    ).toEqual(tokenizar("bicicleta").map((t) => t.token));
  });
});

describe("porcentaje de coincidencia (capability evals)", () => {
  const perfiles = [perfil("ana"), perfil("beto")];

  it("match exacto en misma categoría >= 90%", () => {
    const c = ctx(perfiles, [
      pub({
        id: "b1",
        usuarioId: "ana",
        tipo: "busco",
        titulo: "Busco guitarra",
        categoria: "musica",
      }),
      pub({
        id: "o1",
        usuarioId: "beto",
        tipo: "ofrezco",
        titulo: "Guitarra criolla",
        categoria: "musica",
      }),
    ]);
    expect(arista(c, "b1", "o1")!.porcentaje).toBeGreaterThanOrEqual(90);
  });

  it('sinónimo rioplatense ("criolla" ~ "guitarra") >= 80%', () => {
    const c = ctx(perfiles, [
      pub({
        id: "b1",
        usuarioId: "ana",
        tipo: "busco",
        titulo: "Busco guitarra",
        categoria: "musica",
      }),
      pub({
        id: "o1",
        usuarioId: "beto",
        tipo: "ofrezco",
        titulo: "Trueco mi criolla usada",
        categoria: "musica",
      }),
    ]);
    expect(arista(c, "b1", "o1")!.porcentaje).toBeGreaterThanOrEqual(80);
  });

  it('typo ("gitarra") >= 60%', () => {
    const c = ctx(perfiles, [
      pub({
        id: "b1",
        usuarioId: "ana",
        tipo: "busco",
        titulo: "gitarra",
        categoria: "musica",
      }),
      pub({
        id: "o1",
        usuarioId: "beto",
        tipo: "ofrezco",
        titulo: "Guitarra",
        categoria: "musica",
      }),
    ]);
    const a = arista(c, "b1", "o1")!;
    expect(a.porcentaje).toBeGreaterThanOrEqual(60);
    expect(a.porcentaje).toBeLessThan(100);
  });

  it("coincidencia parcial queda en rango medio", () => {
    const c = ctx(perfiles, [
      pub({
        id: "b1",
        usuarioId: "ana",
        tipo: "busco",
        titulo: "Bicicleta rodado 20 para nena",
        categoria: "deportes",
      }),
      pub({
        id: "o1",
        usuarioId: "beto",
        tipo: "ofrezco",
        titulo: "Bici playera rodado 20",
        categoria: "deportes",
      }),
    ]);
    const p = arista(c, "b1", "o1")!.porcentaje;
    expect(p).toBeGreaterThanOrEqual(55);
    expect(p).toBeLessThan(95);
  });

  it("sin relación => no hay arista", () => {
    const c = ctx(perfiles, [
      pub({
        id: "b1",
        usuarioId: "ana",
        tipo: "busco",
        titulo: "Busco guitarra",
        categoria: "musica",
      }),
      pub({
        id: "o1",
        usuarioId: "beto",
        tipo: "ofrezco",
        titulo: "Heladera con freezer",
        categoria: "electro",
      }),
    ]);
    expect(arista(c, "b1", "o1")).toBeUndefined();
  });

  it("cruce servicio<->objeto con término compartido no llega al dashboard", () => {
    const c = ctx(perfiles, [
      pub({
        id: "b1",
        usuarioId: "ana",
        tipo: "busco",
        titulo: "Clases de guitarra",
        categoria: "clases",
      }),
      pub({
        id: "o1",
        usuarioId: "beto",
        tipo: "ofrezco",
        titulo: "Guitarra criolla",
        categoria: "musica",
      }),
    ]);
    const a = arista(c, "b1", "o1");
    expect(!a || a.porcentaje < cfg.porcentajeMinimoDashboard).toBeTruthy();
  });

  it('"qué busca a cambio" funciona como deseo virtual', () => {
    const c = ctx(perfiles, [
      pub({
        id: "o-ana",
        usuarioId: "ana",
        tipo: "ofrezco",
        titulo: "Taladro percutor",
        categoria: "herramientas",
        queBuscaACambio: "libros de cocina",
      }),
      pub({
        id: "o-beto",
        usuarioId: "beto",
        tipo: "ofrezco",
        titulo: "Libros de cocina varios",
        categoria: "libros",
      }),
    ]);
    const a = arista(c, "o-ana#a-cambio", "o-beto")!;
    expect(a.buscoVirtual).toBeTruthy();
    expect(a.porcentaje).toBeGreaterThanOrEqual(80);
  });

  it("embeddings suman cuando no hay palabras en común y nunca hunden un match léxico", () => {
    const v = (x: number) => [x, 1 - x, 0.2];
    const c = ctx(perfiles, [
      pub({
        id: "b1",
        usuarioId: "ana",
        tipo: "busco",
        titulo: "Algo para tomar mate",
        categoria: "hogar",
        embedding: v(0.9),
      }),
      pub({
        id: "o1",
        usuarioId: "beto",
        tipo: "ofrezco",
        titulo: "Termo Stanley",
        categoria: "hogar",
        embedding: v(0.88),
      }),
      pub({
        id: "b2",
        usuarioId: "ana",
        tipo: "busco",
        titulo: "Guitarra",
        categoria: "musica",
        embedding: [1, 0, 0],
      }),
      pub({
        id: "o2",
        usuarioId: "beto",
        tipo: "ofrezco",
        titulo: "Guitarra",
        categoria: "musica",
        embedding: [0, 1, 0],
      }),
    ]);
    const g = construirGrafo(c, cfg);
    const sem = g.aristas.find((a) => a.buscoId === "b1" && a.ofrezcoId === "o1");
    expect(sem && sem.desglose.fuenteRelevancia === "semantica").toBeTruthy();
    const lex = g.aristas.find((a) => a.buscoId === "b2" && a.ofrezcoId === "o2")!;
    expect(lex.porcentaje).toBe(100);
  });
});

describe("reglas no negociables", () => {
  it("la distancia NO cambia el %, solo el ranking; fuera de radio no hay match", () => {
    const c = ctx(
      [
        perfil("ana"),
        perfil("cerca", { zonaId: "palermo" }),
        perfil("lejos", { zonaId: "belgrano" }),
        perfil("platense", { zonaId: "la-plata" }),
      ],
      [
        pub({
          id: "b1",
          usuarioId: "ana",
          tipo: "busco",
          titulo: "Guitarra",
          categoria: "musica",
        }),
        pub({
          id: "o-cerca",
          usuarioId: "cerca",
          tipo: "ofrezco",
          titulo: "Guitarra",
          categoria: "musica",
          zonaId: "palermo",
        }),
        pub({
          id: "o-lejos",
          usuarioId: "lejos",
          tipo: "ofrezco",
          titulo: "Guitarra",
          categoria: "musica",
          zonaId: "belgrano",
        }),
        pub({
          id: "o-lp",
          usuarioId: "platense",
          tipo: "ofrezco",
          titulo: "Guitarra",
          categoria: "musica",
          zonaId: "la-plata",
        }),
      ],
    );
    const cerca = arista(c, "b1", "o-cerca")!;
    const lejos = arista(c, "b1", "o-lejos")!;
    expect(cerca.porcentaje).toBe(lejos.porcentaje);
    expect(cerca.rankScore > lejos.rankScore).toBeTruthy();
    expect(arista(c, "b1", "o-lp")).toBeUndefined();
  });

  it("Créditos Vecinales nunca cambian el %; solo desempatan", () => {
    const c = ctx(
      [
        perfil("ana"),
        perfil("pobre", { creditosVecinales: 0 }),
        perfil("rico", { creditosVecinales: 500 }),
      ],
      [
        pub({
          id: "b1",
          usuarioId: "ana",
          tipo: "busco",
          titulo: "Guitarra",
          categoria: "musica",
        }),
        pub({
          id: "o-a",
          usuarioId: "pobre",
          tipo: "ofrezco",
          titulo: "Guitarra",
          categoria: "musica",
        }),
        pub({
          id: "o-b",
          usuarioId: "rico",
          tipo: "ofrezco",
          titulo: "Guitarra",
          categoria: "musica",
        }),
      ],
    );
    expect(arista(c, "b1", "o-a")!.porcentaje).toBe(
      arista(c, "b1", "o-b")!.porcentaje,
    );
    expect(arista(c, "b1", "o-a")!.rankScore).toBe(
      arista(c, "b1", "o-b")!.rankScore,
    );
    const top = sugerenciasDashboard("ana", construirGrafo(c, cfg), c, cfg);
    expect(top[0]!.contrapartes[0]).toBe("rico");
  });

  it("bloqueos, cuentas sin confirmar, suspendidas y publicaciones no activas quedan afuera", () => {
    const c = ctx(
      [
        perfil("ana"),
        perfil("bloq"),
        perfil("sinconf", { cuentaConfirmada: false }),
        perfil("susp", { suspendido: true }),
        perfil("pausa"),
      ],
      [
        pub({
          id: "b1",
          usuarioId: "ana",
          tipo: "busco",
          titulo: "Guitarra",
          categoria: "musica",
        }),
        pub({
          id: "o1",
          usuarioId: "bloq",
          tipo: "ofrezco",
          titulo: "Guitarra",
          categoria: "musica",
        }),
        pub({
          id: "o2",
          usuarioId: "sinconf",
          tipo: "ofrezco",
          titulo: "Guitarra",
          categoria: "musica",
        }),
        pub({
          id: "o3",
          usuarioId: "susp",
          tipo: "ofrezco",
          titulo: "Guitarra",
          categoria: "musica",
        }),
        pub({
          id: "o4",
          usuarioId: "pausa",
          tipo: "ofrezco",
          titulo: "Guitarra",
          categoria: "musica",
          estado: "pausada",
        }),
        pub({
          id: "o5",
          usuarioId: "pausa",
          tipo: "ofrezco",
          titulo: "Guitarra",
          categoria: "musica",
          venceEn: new Date(AHORA.getTime() - 1),
        }),
      ],
      { bloqueos: [["bloq", "ana"]] },
    );
    expect(construirGrafo(c, cfg).aristas.length).toBe(0);
  });

  it("nunca se matchea una publicación consigo mismo", () => {
    const c = ctx(
      [perfil("ana")],
      [
        pub({
          usuarioId: "ana",
          tipo: "busco",
          titulo: "Guitarra",
          categoria: "musica",
        }),
        pub({
          usuarioId: "ana",
          tipo: "ofrezco",
          titulo: "Guitarra",
          categoria: "musica",
        }),
      ],
    );
    expect(construirGrafo(c, cfg).aristas.length).toBe(0);
  });
});

describe("dashboard", () => {
  const pamelaPedro = () =>
    ctx(
      [perfil("pamela"), perfil("pedro")],
      [
        pub({
          id: "p-busca",
          usuarioId: "pamela",
          tipo: "busco",
          titulo: "Guitarra",
          categoria: "musica",
        }),
        pub({
          id: "p-ofrece",
          usuarioId: "pamela",
          tipo: "ofrezco",
          titulo: "Clases de inglés online",
          categoria: "clases",
        }),
        pub({
          id: "pe-ofrece",
          usuarioId: "pedro",
          tipo: "ofrezco",
          titulo: "Guitarra criolla",
          categoria: "musica",
        }),
        pub({
          id: "pe-busca",
          usuarioId: "pedro",
          tipo: "busco",
          titulo: "Clases de inglés",
          categoria: "clases",
        }),
      ],
    );

  it("match mutuo aparece primero, con % geométrico", () => {
    const c = pamelaPedro();
    const top = sugerenciasDashboard("pamela", construirGrafo(c, cfg), c, cfg);
    expect(top[0]!.tipo).toBe("match_mutuo");
    expect(top[0]!.confianza).toBe("alta");
    expect(top[0]!.porcentaje).toBeGreaterThanOrEqual(80);
  });

  it("descarte: se oculta durante el enfriamiento y reaparece si mejora +15 pp", () => {
    const c = pamelaPedro();
    const g = construirGrafo(c, cfg);
    const [s] = sugerenciasDashboard("pamela", g, c, cfg);
    c.descartes = [
      {
        usuarioId: "pamela",
        claveSugerencia: s!.clave,
        descartadoEn: AHORA,
        porcentajeAlDescartar: s!.porcentaje,
      },
    ];
    expect(
      !sugerenciasDashboard("pamela", g, c, cfg).some((x) => x.clave === s!.clave),
    ).toBeTruthy();
    c.descartes[0]!.porcentajeAlDescartar = s!.porcentaje - 20;
    expect(
      sugerenciasDashboard("pamela", g, c, cfg).some((x) => x.clave === s!.clave),
    ).toBeTruthy();
  });

  it("no se sugiere lo que ya está en un intercambio abierto", () => {
    const c = pamelaPedro();
    c.intercambiosAbiertos = [
      {
        publicacionIds: ["pe-ofrece", "p-ofrece"],
        usuarioIds: ["pamela", "pedro"],
      },
    ];
    const top = sugerenciasDashboard("pamela", construirGrafo(c, cfg), c, cfg);
    expect(
      !top.some((s) => s.aristas.some((a) => a.ofrezcoId === "pe-ofrece")),
    ).toBeTruthy();
  });

  it("diversidad: máx. 2 por contraparte y top-K respetado", () => {
    const pubs = [
      pub({
        usuarioId: "ana",
        tipo: "ofrezco",
        titulo: "Libros",
        categoria: "libros",
      }),
    ];
    for (let i = 0; i < 5; i++)
      pubs.push(
        pub({
          usuarioId: "ana",
          tipo: "busco",
          titulo: `Guitarra modelo ${i}`,
          categoria: "musica",
        }),
      );
    for (let i = 0; i < 5; i++)
      pubs.push(
        pub({
          usuarioId: "beto",
          tipo: "ofrezco",
          titulo: `Guitarra modelo ${i}`,
          categoria: "musica",
        }),
      );
    for (let i = 0; i < 10; i++)
      pubs.push(
        pub({
          usuarioId: `u${i}`,
          tipo: "ofrezco",
          titulo: "Guitarra",
          categoria: "musica",
        }),
      );
    const perfiles = [
      perfil("ana"),
      perfil("beto"),
      ...Array.from({ length: 10 }, (_, i) => perfil(`u${i}`)),
    ];
    const c = ctx(perfiles, pubs);
    const top = sugerenciasDashboard("ana", construirGrafo(c, cfg), c, cfg);
    expect(top.length).toBeLessThanOrEqual(cfg.topK);
    expect(
      top.filter((s) => s.contrapartes.includes("beto")).length,
    ).toBeLessThanOrEqual(cfg.maxPorContraparte);
    const porPropia = new Map<string, number>();
    for (const s of top)
      for (const p of s.publicacionesPropias)
        porPropia.set(p, (porPropia.get(p) ?? 0) + 1);
    expect(
      [...porPropia.values()].every((n) => n <= cfg.maxPorPublicacionPropia),
    ).toBeTruthy();
  });

  it("matches de una publicación puntual", () => {
    const c = pamelaPedro();
    const m = matchesDePublicacion("p-busca", construirGrafo(c, cfg), cfg);
    expect(m[0]!.ofrezcoId).toBe("pe-ofrece");
  });

  it("determinismo: dos corridas dan exactamente lo mismo", () => {
    const a = JSON.stringify(
      sugerenciasDashboard(
        "pamela",
        construirGrafo(pamelaPedro(), cfg),
        pamelaPedro(),
        cfg,
      ),
    );
    const b = JSON.stringify(
      sugerenciasDashboard(
        "pamela",
        construirGrafo(pamelaPedro(), cfg),
        pamelaPedro(),
        cfg,
      ),
    );
    expect(a).toBe(b);
  });
});

describe("triangulación", () => {
  const triangulo = (extra = {}) =>
    ctx(
      [perfil("pamela"), perfil("pedro"), perfil("carla")],
      [
        pub({
          id: "pam-b",
          usuarioId: "pamela",
          tipo: "busco",
          titulo: "Guitarra",
          categoria: "musica",
        }),
        pub({
          id: "pam-o",
          usuarioId: "pamela",
          tipo: "ofrezco",
          titulo: "Clases de inglés",
          categoria: "clases",
        }),
        pub({
          id: "ped-o",
          usuarioId: "pedro",
          tipo: "ofrezco",
          titulo: "Guitarra criolla",
          categoria: "musica",
        }),
        pub({
          id: "ped-b",
          usuarioId: "pedro",
          tipo: "busco",
          titulo: "Bicicleta rodado 26",
          categoria: "deportes",
        }),
        pub({
          id: "car-o",
          usuarioId: "carla",
          tipo: "ofrezco",
          titulo: "Bici rodado 26",
          categoria: "deportes",
        }),
        pub({
          id: "car-b",
          usuarioId: "carla",
          tipo: "busco",
          titulo: "Clases de inglés",
          categoria: "clases",
        }),
      ],
      extra,
    );

  it("encuentra el ciclo Pamela -> Pedro -> Carla y lo muestra a los tres", () => {
    const c = triangulo();
    const r = calcularRegion(c, cfg);
    expect(r.ciclosAsignados.length).toBe(1);
    expect([...r.ciclosAsignados[0]!.usuarios].sort()).toEqual([
      "carla",
      "pamela",
      "pedro",
    ]);
    for (const u of ["pamela", "pedro", "carla"]) {
      expect(r.dashboard(u).some((s) => s.tipo === "ciclo")).toBeTruthy();
    }
  });

  it("un bloqueo entre dos miembros anula el ciclo", () => {
    const c = triangulo({ bloqueos: [["carla", "pedro"]] });
    expect(
      asignarCiclos(encontrarCiclos(construirGrafo(c, cfg), c, cfg)).length,
    ).toBe(0);
  });

  it("asignación sin solapamiento: una publicación en un solo ciclo", () => {
    const c = triangulo();
    c.perfiles.set("dora", perfil("dora"));
    c.publicaciones.push(
      pub({
        id: "dor-o",
        usuarioId: "dora",
        tipo: "ofrezco",
        titulo: "Bicicleta rodado 26",
        categoria: "deportes",
      }),
      pub({
        id: "dor-b",
        usuarioId: "dora",
        tipo: "busco",
        titulo: "Clases de inglés",
        categoria: "clases",
      }),
    );
    const g = construirGrafo(c, cfg);
    const todos = encontrarCiclos(g, c, cfg);
    const asignados = asignarCiclos(todos);
    expect(todos.length > asignados.length).toBeTruthy();
    const usados = asignados.flatMap((x) => x.aristas.map((a) => a.ofrezcoId));
    expect(new Set(usados).size).toBe(usados.length);
  });
});

describe("demanda zonal", () => {
  const escenario = (nBuscadores: number, nOfertas = 0) => {
    const perfiles = [
      perfil("nuevo", { intercambiosCompletados: 0 }),
      perfil("veterano", { intercambiosCompletados: 8 }),
      perfil("medio", { intercambiosCompletados: 2, zonaId: "palermo" }),
    ];
    const pubs = [];
    const titulos = [
      "Busco bici para ir al trabajo",
      "Bicicleta rodado 20 para mi nena",
      "Necesito una bici playera",
      "Bicicleta mountain",
      "Bici de paseo",
    ];
    for (let i = 0; i < nBuscadores; i++) {
      perfiles.push(
        perfil(`b${i}`, {
          zonaId: i % 2 ? "palermo" : "villa-crespo",
        }),
      );
      pubs.push(
        pub({
          usuarioId: `b${i}`,
          tipo: "busco",
          titulo: titulos[i % titulos.length]!,
          categoria: "deportes",
          zonaId: i % 2 ? "palermo" : "villa-crespo",
        }),
      );
    }
    for (let i = 0; i < nOfertas; i++) {
      perfiles.push(perfil(`o${i}`));
      pubs.push(
        pub({
          usuarioId: `o${i}`,
          tipo: "ofrezco",
          titulo: "Bicicleta",
          categoria: "deportes",
        }),
      );
    }
    return ctx(perfiles, pubs);
  };

  it("sugiere publicar lo que buscan >= k vecinos y no tiene oferta", () => {
    const c = escenario(4);
    const s = sugerenciasDemanda(construirGrafo(c, cfg), c, cfg).get("nuevo")!;
    expect(s[0]!.etiqueta).toBe("bicicleta");
    expect(s[0]!.vecinosBuscando).toBe(4);
    expect(s[0]!.mensaje).toMatch(/4 vecinos están buscando “bicicleta”/);
    expect(s[0]!.deepLink).toMatch(/origen=demanda_zonal/);
  });

  it("k-anonimato: con 2 vecinos no se muestra nada", () => {
    const c = escenario(2);
    expect(sugerenciasDemanda(construirGrafo(c, cfg), c, cfg).size).toBe(0);
  });

  it('si la oferta ya cubre la demanda, no es "alta demanda"', () => {
    const c = escenario(3, 3);
    expect(
      sugerenciasDemanda(construirGrafo(c, cfg), c, cfg).get("nuevo"),
    ).toBeUndefined();
  });

  it("a quien la busca no se le pide que la ofrezca", () => {
    const c = escenario(4);
    const r = sugerenciasDemanda(construirGrafo(c, cfg), c, cfg);
    expect(r.get("b0")).toBeUndefined();
  });

  it("push prioriza a quien menos trueques cerró, respeta tope y frecuencia", () => {
    const c = escenario(4);
    const s = sugerenciasDemanda(construirGrafo(c, cfg), c, cfg);
    const plan = planificarPushDemanda(s, c.perfiles, new Map(), AHORA, cfg);
    expect(plan[0]!.usuarioId).toBe("nuevo");
    expect(!plan.some((p) => p.usuarioId === "veterano")).toBeTruthy();
    const conCooldown = planificarPushDemanda(
      s,
      c.perfiles,
      new Map([["nuevo", AHORA]]),
      AHORA,
      cfg,
    );
    expect(!conCooldown.some((p) => p.usuarioId === "nuevo")).toBeTruthy();
    const presupuesto1 = planificarPushDemanda(
      s,
      c.perfiles,
      new Map(),
      AHORA,
      crearConfig({
        demanda: { ...cfg.demanda, presupuestoPushPorZonaPorDia: 1 },
      }),
    );
    expect(presupuesto1.map((p) => p.usuarioId).sort()).toEqual([
      "medio",
      "nuevo",
    ]);
  });
});

describe("presentación (API)", () => {
  it("DTO no expone rankScore, embeddings ni distancia exacta", () => {
    const c = ctx(
      [perfil("ana"), perfil("beto", { zonaId: "almagro" })],
      [
        pub({
          id: "b1",
          usuarioId: "ana",
          tipo: "busco",
          titulo: "Guitarra",
          categoria: "musica",
          embedding: [1, 2, 3],
        }),
        pub({
          id: "o1",
          usuarioId: "beto",
          tipo: "ofrezco",
          titulo: "Guitarra",
          categoria: "musica",
          zonaId: "almagro",
          embedding: [1, 2, 3],
        }),
      ],
    );
    const [s] = sugerenciasDashboard("ana", construirGrafo(c, cfg), c, cfg);
    const dto = presentarSugerencia(s!, "ana", c);
    const json = JSON.stringify(dto);
    expect(!/rankScore|embedding|lat|lng|creditos/.test(json)).toBeTruthy();
    expect(dto.distancia).toMatch(/^a ~\d+(,5)? km$|^a menos de 1 km$/);
    expect(dto.porcentaje).toBe(100);
  });
});

describe("performance (regression)", () => {
  it("2.000 publicaciones en < 3 s", () => {
    const palabras = [
      "guitarra",
      "bicicleta",
      "heladera",
      "silla",
      "mesa",
      "libro",
      "campera",
      "taladro",
      "clases",
      "plomero",
      "juguete",
      "celular",
      "notebook",
      "maceta",
      "lampara",
    ];
    const cats = [
      "musica",
      "deportes",
      "electro",
      "muebles",
      "muebles",
      "libros",
      "ropa",
      "herramientas",
      "clases",
      "oficios",
      "juguetes",
      "tecnologia",
      "tecnologia",
      "jardin",
      "hogar",
    ];
    const zonas = ["villa-crespo", "palermo", "almagro", "belgrano"];
    const perfiles = Array.from({ length: 400 }, (_, i) =>
      perfil(`u${i}`, { zonaId: zonas[i % 4]! }),
    );
    const pubs = Array.from({ length: 2000 }, (_, i) => {
      const k = (i * 7) % palabras.length;
      return pub({
        usuarioId: `u${i % 400}`,
        tipo: i % 2 ? "busco" : "ofrezco",
        titulo: `${palabras[k]} ${palabras[(k + i) % palabras.length]} ${i % 13}`,
        categoria: cats[k]!,
        zonaId: zonas[i % 4]!,
      });
    });
    const t0 = Date.now();
    const r = calcularRegion(ctx(perfiles, pubs), cfg);
    for (let i = 0; i < 400; i++) r.dashboard(`u${i}`);
    const ms = Date.now() - t0;
    expect(ms).toBeLessThan(3000);
  });
});

describe("regresiones del code review", () => {
  it("un ciclo absorbe sus aristas: no se repiten como sugerencias sueltas", () => {
    const c = ctx(
      [perfil("pamela"), perfil("pedro"), perfil("carla")],
      [
        pub({
          id: "pam-b",
          usuarioId: "pamela",
          tipo: "busco",
          titulo: "Guitarra",
          categoria: "musica",
        }),
        pub({
          id: "pam-o",
          usuarioId: "pamela",
          tipo: "ofrezco",
          titulo: "Clases de inglés",
          categoria: "clases",
        }),
        pub({
          id: "ped-o",
          usuarioId: "pedro",
          tipo: "ofrezco",
          titulo: "Guitarra criolla",
          categoria: "musica",
        }),
        pub({
          id: "ped-b",
          usuarioId: "pedro",
          tipo: "busco",
          titulo: "Bicicleta rodado 26",
          categoria: "deportes",
        }),
        pub({
          id: "car-o",
          usuarioId: "carla",
          tipo: "ofrezco",
          titulo: "Bici rodado 26",
          categoria: "deportes",
        }),
        pub({
          id: "car-b",
          usuarioId: "carla",
          tipo: "busco",
          titulo: "Clases de inglés",
          categoria: "clases",
        }),
      ],
    );
    const top = calcularRegion(c, cfg).dashboard("pamela");
    expect(top.length).toBe(1);
    expect(top[0]!.tipo).toBe("ciclo");
  });

  it("a igual %, el match mutuo rankea por encima del unidireccional", () => {
    const c = ctx(
      [perfil("ana"), perfil("mutuo"), perfil("uni")],
      [
        pub({
          usuarioId: "ana",
          tipo: "busco",
          titulo: "Guitarra",
          categoria: "musica",
        }),
        pub({
          usuarioId: "ana",
          tipo: "ofrezco",
          titulo: "Libros de cocina",
          categoria: "libros",
        }),
        pub({
          usuarioId: "mutuo",
          tipo: "ofrezco",
          titulo: "Guitarra",
          categoria: "musica",
        }),
        pub({
          usuarioId: "mutuo",
          tipo: "busco",
          titulo: "Libros de cocina",
          categoria: "libros",
        }),
        pub({
          usuarioId: "uni",
          tipo: "ofrezco",
          titulo: "Guitarra",
          categoria: "musica",
        }),
      ],
    );
    const top = sugerenciasDashboard("ana", construirGrafo(c, cfg), c, cfg);
    expect(top[0]!.tipo).toBe("match_mutuo");
    expect(top.findIndex((s) => s.contrapartes[0] === "uni")).toBeGreaterThan(
      0,
    );
  });

  it('demanda compara personas: un solo vecino con 3 ofertas no "cubre" a 3 buscadores', () => {
    const perfiles = [
      perfil("nuevo"),
      perfil("acopiador"),
      perfil("b1"),
      perfil("b2"),
      perfil("b3"),
    ];
    const pubs = [
      ...["b1", "b2", "b3"].map((u) =>
        pub({
          usuarioId: u,
          tipo: "busco",
          titulo: "Bicicleta",
          categoria: "deportes",
        }),
      ),
      ...[1, 2, 3].map(() =>
        pub({
          usuarioId: "acopiador",
          tipo: "ofrezco",
          titulo: "Bicicleta",
          categoria: "deportes",
        }),
      ),
    ];
    const c = ctx(perfiles, pubs);
    const s = sugerenciasDemanda(construirGrafo(c, cfg), c, cfg);
    expect(s.get("nuevo")?.[0]?.etiqueta).toBe("bicicleta");
    expect(s.get("acopiador")).toBeUndefined();
  });
});
