# Trocar — Userflow completo del MVP (Fase 1) · v2

Recorrido completo, de la primera vez que se abre la app hasta el trueque calificado. Basado en `Especificacion_Tecnica_Trocar_MVP.md` v1.0, `Master_Prompt_UI_Trocar_MVP.md` y `PRD_Trocar_Fase1.md` v2.0.

- **Pantallas:** 14
- **Módulos cubiertos:** publicación simétrica Ofrezco/Busco · mensajería directa · verificación y reputación · Créditos Vecinales · moderación (reportar/bloquear) transversal
- **Plataforma:** mobile-first, 390×844
- **Piloto:** cerrado, 30–50 vecinos

---

## 1. Máquina de estados del intercambio

```
borrador → publicado
publicado → propuesta ⇄ contrapropuesta → aceptado → coordinando
  → confirmado_por_A + confirmado_por_B → completado
```

Estados laterales (fuera del camino feliz): `cancelado`, `rechazado`, `no_show`, `disputa`, `moderado`.

Reglas clave:
- Créditos Vecinales sólo se emiten cuando el intercambio llega a `completado` (confirmado por ambas partes). No son transferibles.
- El chat/mensajería sólo existe atado a una propuesta de intercambio — nunca hay un botón de "enviar mensaje" libre en el perfil de un desconocido.
- Categorías prohibidas (medicamentos, armas, documentos, animales, servicios regulados) se rechazan con motivo siempre visible → estado `moderado`.
- La calificación de la otra parte se revela cuando el usuario también calificó, o a los 7 días — lo que ocurra primero.
- Verificación = "Teléfono confirmado" / "Email confirmado". Nunca se usa "identidad verificada" ni "usuario verificado".

## 2. Notación del mapa de flujo

| Elemento | Significado |
|---|---|
| Caja verde (borde sólido) | Pantalla del camino feliz |
| Caja dorada (borde sólido) | Pantalla alcanzada por una acción secundaria |
| Caja terracota (borde punteado) | Resultado fuera del camino feliz (rechazo, edición, disputa) |
| Rombo | Decisión del usuario o del sistema |
| Línea sólida | Avance en el flujo |
| Línea punteada | Retorno / bucle a una pantalla anterior |
| Caja sin relleno, borde punteado gris | Nota transversal (no es un paso lineal) |

## 3. Mapa del flujo — orden y ramificaciones

1. **Abrís la app** (inicio)
2. **01–02 · Ingresás y verificás tu cuenta** — teléfono o email + código
   - *Rama:* "ya tenía cuenta" → salta directo al Feed (04)
3. **03 · Onboarding + completar perfil** — cómo funciona · barrio piloto (solo 1ª vez)
4. **04 · Feed principal** — buscás y filtrás Ofrezco / Busco cerca tuyo
   - *Rama:* **+ Publicar** → 05 Creás un Ofrezco o un Busco (borrador → publicado) → vuelve activa al feed
   - *Nota transversal:* Rechazada (moderado) — categoría prohibida, motivo siempre visible
5. **06 · Detalle de publicación** — ves lo que ofrece otro vecino
   - *Rama:* si es tu publicación → Editar / pausar / marcar intercambiada (no dispara propuesta de intercambio)
6. **07 · Proponés un intercambio** — elegís qué ofrecés a cambio
7. **08 · Chat — propuesta pendiente** — estado `propuesta ⇄ contrapropuesta`
   - Decisión (rombo):
     - **Rechaza** → `rechazado`, vuelve al detalle de la publicación (06)
     - **Contraoferta** → `contrapropuesta`, vuelve a 07
     - **Acepta** → `aceptado`, sigue en 09
8. **09 · Coordinan y confirman** — `coordinando → confirmado_por_A + confirmado_por_B`
   - *Rama lateral:* problema en el encuentro → No-show / disputa (motivo obligatorio, queda registrado)
9. **10 · Se califican mutuamente** — estrellas + comentario opcional
10. **11 · Suman Créditos Vecinales** — puntaje no transferible, con trazabilidad
    - Bifurca hacia:
      - **12 · Perfil propio** — reputación actualizada
      - **13 · Perfil público** — el que ve el otro vecino de vos
- **14 · Notificaciones** (nota transversal, no lineal) — cruza todo el flujo: propuestas, contraofertas, mensajes, recordatorios, calificaciones y créditos ganados

---

## Módulo A — Acceso

Confirmación de teléfono o email antes de publicar o proponer nada — nunca se llama "identidad verificada", es solo un canal de contacto real confirmado. El onboarding sólo se muestra la primera vez.

### 01 · Ingresar
- Logo Trocar + tagline: "Intercambiá con tus vecinos, sin plata de por medio."
- Campo: Teléfono o email (placeholder `+54 9 11 ‧‧‧‧ ‧‧‧‧`)
- Botón primario: **Continuar**
- Texto legal: "Al continuar aceptás los Términos y la Política de Privacidad de Trocar."
- **Sigue en** 02 → verificación por código

### 02 · Verificar código
- Back
- "Te enviamos un código" / "a +54 9 11 6543‧‧12"
- 6 casillas OTP (ejemplo con error: 2 dígitos marcados en rojo)
- Mensaje de error: "Código incorrecto. Te quedan 2 intentos."
- Botón primario **Verificar** (deshabilitado hasta completar)
- Ghost: "Reenviar código (00:47)"
- **Si ya existía la cuenta** → salta directo a 04
- **Si es la primera vez** → sigue en 03

### 03 · Completá tu perfil (paso 1 de 2)
- Indicador "Paso 1 de 2" + dots
- Foto de perfil (opcional)
- Campo: Tu nombre (ej. "Pamela")
- Campo: Tu barrio (ej. "Villa Ortúzar ▾")
- Nota de privacidad: "Mostramos tu barrio y una distancia aproximada — nunca tu dirección."
- Botón primario: **Continuar**
- *(Paso 2/2, no wireframeado en este set): aviso de privacidad + categorías de interés como chips*
- **Sigue en** 04 → feed principal

---

## Módulo B — Descubrimiento y publicación

Ofrezco y Busco son dos entradas simétricas del mismo tipo de publicación: se puede publicar una necesidad sin tener nada para ofrecer todavía. El feed es el centro de gravedad del MVP.

### 04 · Feed principal
- Header: "Hola, Pamela" + icono de notificaciones
- Buscador: "🔍 Buscá guitarra, clases, bici…"
- Segmented control: **Ofrezco** / Busco
- Chips de filtro: Todo (activo) · Hogar · Cerca mío
- Listado de publicaciones, cada una con:
  - Chip de estado (Ofrezco / Busco)
  - Título
  - Avatar + nombre del vecino + distancia (ej. "Julián · a 320 m")
- Nav inferior (4 ítems): Inicio · Chats · **+** (FAB, publicar) · Perfil
- **Toca +** → 05 crear publicación
- **Toca una tarjeta** → 06 detalle

### 05 · Crear publicación
- Back: "Nueva publicación"
- Segmented control: Ofrezco (activo) / Busco
- Selector de foto (+ agregar)
- Campo: Título (ej. "Zapatillas urbanas talle 40")
- Campo: Categoría (ej. "Ropa y calzado ▾")
- Chips de condición: Nuevo / Como nuevo (seleccionado) / Usado
- Campo opcional: "¿Qué te gustaría a cambio? (opcional)"
- Nota expandible: "▾ Qué no se puede publicar: medicamentos, armas, documentos, animales, servicios regulados."
- Botón primario: **Publicar**
- **Publicar** → vuelve a 04, ahora visible en el feed
- **Categoría prohibida** → rechazo con motivo visible (estado `moderado`)

### 06 · Detalle de publicación
- Imagen grande + menú **⋯** (Reportar/Bloquear) superpuesto
- Chip de estado: Ofrezco
- Título: "Bicicleta rodado 26 — buen estado"
- Avatar + "Julián P." + estrellas y cantidad de reseñas (★★★★☆ · 12)
- Badge: **Teléfono confirmado**
- Descripción: "Poco uso, frenos revisados el mes pasado. Ideal para moverse por el barrio."
- Tarjeta: "Busca a cambio: clases de guitarra o herramientas de jardín"
- Metadata: categoría · distancia · antigüedad de publicación
- Botón primario: **Proponer intercambio**
- **Si es tuya** → botones "Editar" / "Pausar" en vez de proponer
- **Si es de otro vecino** → 07
- **⋯** → Reportar / Bloquear

---

## Módulo C — Flujo de intercambio (núcleo del MVP)

De la propuesta a los Créditos Vecinales, recorriendo la máquina de estados `propuesta → aceptado → coordinando → completado`. Objetivo de Fase 1: ≥60% de intercambios elegibles completados sin salir de la app.

### 07 · Proponer intercambio
- Back: "Proponer intercambio"
- Publicación del otro vecino (resumen)
- "¿Qué ofrecés vos?" → selector de una publicación propia (con opción "+ Ofrecer un servicio nuevo")
- Campo opcional: mensaje (ej. "Hola Julián! Te propongo cambiar tus clases de guitarra por la bici, ¿te sirve?")
- Botón primario: **Enviar propuesta**
- Nota: "Vas a coordinar los detalles en el chat"
- **Enviar** → crea el chat (estado `PROPUESTA`), sigue en 08
- **Sin publicaciones propias** → invita a publicar algo primero

### 08 · Chat — propuesta pendiente
- Header: avatar + "Julián P." + badge "✓ Tel. confirmado" + menú **⋯**
- Tarjeta de propuesta: chip de estado "Propuesta" · resumen del swap ("🚲 Bicicleta ⇄ 🎸 Clases (4)")
- Botones de acción dentro de la tarjeta: **Aceptar** / **Contraofertar** / **Rechazar**
- Burbuja de sistema: "Julián propuso: Bicicleta rodado 26 por Clases de guitarra (4h)"
- Burbujas de chat normales
- Campo de mensaje
- **Rechaza** → estado `rechazado`, vuelve a 06
- **Contraofertar** → estado `contrapropuesta`, vuelve a 07
- **Acepta** → estado `aceptado`, sigue en 09

### 09 · Coordinando + confirmación
- Header: avatar + nombre + menú ⋯
- Chip de estado: "Coordinando"
- **Stepper de 4 pasos:** Propuesta (hecho) → Acuerdo (hecho) → Encuentro (activo) → Confirmación (pendiente)
- Campo con lugar/fecha acordados: "📅 Sáb. 27 · 11:00 — Plaza Arata"
- Tip de seguridad: "🛡️ Encontrate en un lugar público y con luz."
- Burbujas de chat de coordinación
- Botón primario: **Ya hicimos el intercambio**
- Acciones secundarias: Cancelar / Reportar un problema
- Estado de confirmación bilateral: "Confirmado por vos · esperando a Julián"
- **Confirman ambas partes** → estado `completado`, sigue en 10
- **Reportar un problema** → estado `no_show` / `disputa`

### 10 · Calificación
- Avatar + "¿Cómo fue tu trueque con Julián?"
- Selector de estrellas (★★★★★)
- Chips rápidos: Puntual (activo) · Buena onda (activo) · Tal cual lo describió
- Campo de comentario opcional (máx. 200 caracteres)
- Nota (regla de revelación): "Vas a ver su calificación cuando vos también califiques, o en 7 días."
- Botón primario: **Enviar calificación**
- **Enviar** → sigue en 11 (solo se habilita con estado `completado`)

### 11 · Créditos Vecinales
- Toast de celebración: 🎉 "¡Trueque concretado!" · **+10** Créditos Vecinales (valor ilustrativo)
- Nota: "Los Créditos Vecinales son tu reputación en Trocar. No se venden ni se transfieren."
- Tira de estadísticas: Créditos totales (128) · Calificación (4.8) · Trueques (14)
- Botón secundario: **Volver al feed**
- *Nota de diseño:* el puntaje se muestra siempre junto a su trazabilidad (de qué intercambio salió), como mitigación de riesgo frente al colapso histórico de la Red Global de Trueque (Argentina 2001–2002).

---

## Módulo D — Perfiles

Confirmación de contacto y reputación en un mismo lugar — nunca "identidad verificada". El perfil propio se edita; el perfil público sólo se consulta, y es lo primero que un vecino revisa antes de aceptar una propuesta.

### 12 · Perfil propio
- Avatar + "Pamela M." + ícono de configuración
- "Villa Ortúzar · desde ago. 2026"
- Badge: Teléfono confirmado
- Tira de estadísticas: Créditos (128, con tooltip ⓘ) · Rating (4.8) · Completados (14)
- Tabs: Publicaciones (activo) · Historial · Reseñas
- Listado de publicaciones propias con su estado (Activa · N propuestas / Completado)
- Nav inferior con Perfil activo
- Accesible en cualquier momento desde la navegación inferior · créditos no transferibles, con tooltip explicativo

### 13 · Perfil público
- Back + menú ⋯ (Reportar / Bloquear)
- Avatar + "Julián P." + "Villa Ortúzar · desde jul. 2026" + badge Teléfono confirmado
- Tira de estadísticas: Créditos (96) · Rating (4.6 · 22 reseñas) · Completados (9)
- Reseñas recientes (2 ejemplos con nombre, estrellas y comentario)
- Botón primario: **Ver sus publicaciones**
- Se abre desde 06 (detalle), 08/09 (chat) o cualquier avatar
- **⋯** → Reportar / Bloquear
- Caso borde: con menos del mínimo de reseñas → "Aún sin calificaciones suficientes" en vez del promedio

---

## Módulo E — Soporte transversal

Las notificaciones no son un paso del flujo: son lo que trae de vuelta a la app en cada punto de decisión. Agrupadas por "Hoy" y "Esta semana", nunca una por cada micro-evento.

### 14 · Notificaciones
- Header: "Notificaciones" + "Marcar todo leído"
- **Hoy:**
  - 🤝 "Julián te propuso un intercambio por tu bicicleta" (hace 5 min)
  - ↔️ "Carla te hizo una contraoferta" (hace 22 min)
  - 💬 "Nuevo mensaje de Carla" (hace 40 min)
- **Esta semana:**
  - ✅ "Pedro aceptó tu propuesta" (ayer)
  - 📍 "Recordatorio: coordiná el encuentro con Pedro" (ayer)
  - 🌱 "¡Ganaste +10 Créditos Vecinales!" (hace 2 días)
  - ⭐ "Tu calificación de Pedro ya está disponible" (hace 2 días)
- Cada ítem lleva directo a 07/08 (contraoferta), 09 (coordinando), 10 (calificación) u 11 (créditos)

---

## Supuestos declarados

- **Confirmación de contacto:** la Especificación Técnica no fija el largo exacto del código; se asumió 6 dígitos por SMS o email, estándar de la industria. El resultado siempre se llama "Teléfono confirmado" / "Email confirmado" — nunca "identidad verificada".
- **Motor de matches (Fase 1.5):** este MVP asume trueque directo, sin el agente de ciclos que cruza Ofrezco/Busco (documentado en la lógica de triangulación y matching). El modelo de datos ya lo deja posible sin refactor, pero el motor no se construye en Fase 1.
- **Créditos Vecinales:** el valor "+10" es ilustrativo — la fórmula base y el límite de emisión se definen en la Semana 5 del roadmap. El bonus por coordinación 100% in-app es una propuesta, no un requisito cerrado de Fase 1.
- **Barrio de ejemplo:** "Villa Ortúzar" es el barrio ficticio usado en los mockups — el barrio piloto real todavía es un prerrequisito P0 a confirmar antes de la Semana 1.

## Fuentes

- `Especificacion_Tecnica_Trocar_MVP.md` v1.0 (22 sep. 2026)
- `Master_Prompt_UI_Trocar_MVP.md`
- `PRD_Trocar_Fase1.md` v2.0
- `Logica_Triangulacion_Matching_Trocar.md` (contexto de Fase 1.5, fuera de alcance de este MVP)

## Versión visual

Diagrama de flujo + wireframes de alta resolución para las 14 pantallas: https://claude.ai/artifact/3W8Y4x1RKRmtisQMqqw19D
