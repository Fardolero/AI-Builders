# Testing

## Pirámide

| Capa | Runner | Ubicación | Qué cubre |
| --- | --- | --- | --- |
| Unit | Vitest + Testing Library | `src/__tests__/unit/` | `cn()`, schemas Zod, hooks, UI, route handlers |
| E2E | Playwright | `src/__tests__/e2e/` | Home, `GET /api/health` |

Los mocks de I/O (Prisma, `auth()`) viven solo en unit tests. E2E habla con la app real.

## Local

```bash
npm test                 # Vitest una vez
npm run test:watch       # watch
npm run test:coverage    # cobertura
npm run test:e2e         # Playwright (levanta `next dev` si no hay server)
npm run test:e2e:ui      # UI mode
```

Playwright usa `http://127.0.0.1:3000`. Si el puerto está ocupado, define `PLAYWRIGHT_BASE_URL`.

En CI, Playwright ejecuta `npm run start` **después** de `npm run build` (`playwright.config.ts`).

## Convenciones de nombrado

| Tipo | Patrón | Ejemplo |
| --- | --- | --- |
| Unit | `*.test.ts` / `*.test.tsx` | `cn.test.ts`, `button.test.tsx` |
| E2E | `*.spec.ts` | `home.spec.ts` |
| Suite | `describe("unidad")` en español o inglés, consistente por archivo |
| Caso | `it("comportamiento esperado")` |

Agrupa por **comportamiento**, no por implementación:

```ts
describe("GET /api/posts", () => {
  it("devuelve 401 sin sesión", async () => { /* ... */ });
});
```

## Qué testear (mínimo de este starter)

- **Utilidades:** `cn()` (merge y falsy).
- **Schemas:** payloads válidos e inválidos de APIs (`createPostSchema`).
- **Hooks:** `useMounted` con `renderHook`.
- **UI crítica:** `Button` render + click.
- **APIs:** `GET /api/health`; `GET`/`POST /api/posts` con `auth` y Prisma mockeados.
- **E2E:** heading de home + health HTTP.

Añade tests cuando toques rutas protegidas, pagos o lógica de dominio. No persigas 100% de cobertura en páginas de layout.

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`):

- Job `quality`: lint, Prettier check, `tsc`, Vitest.
- Job `e2e`: build + Playwright Chromium; sube `playwright-report` si falla.

Variables mínimas en CI (placeholders, no secretos reales):

- `AUTH_SECRET`
- `DATABASE_URL` (no hace falta que el host exista para unit/health)
- `AUTH_URL`

## Debugging

```bash
npx vitest run src/__tests__/unit/posts-route.test.ts
npx playwright test --debug
npx playwright show-report
```
