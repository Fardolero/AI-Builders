# Referencia de configuración

Este kit ya incluye los archivos. Si los regeneras a mano, usa estos contenidos.

## `next.config.ts`

Configurado para Vercel: `serverExternalPackages` para Prisma, headers en `/api/*`, imágenes de avatares de GitHub.

Ver [next.config.ts](../next.config.ts).

## `tsconfig.json`

`strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, paths `@/*` → `./src/*`.

## ESLint + Prettier (sin conflictos)

- **Fuente de verdad en Next 15:** `eslint.config.mjs` (Flat Config).
- `eslint-config-prettier` va **al final** del array: apaga reglas de formato.
- Prettier formatea; ESLint no usa `eslint-plugin-prettier` (evita doble paso y peleas).
- `.eslintrc.json` es el equivalente clásico (`extends: next..., prettier` último). ESLint 9 lo ignora si existe `eslint.config.mjs`.

## Tailwind CSS v4

- PostCSS: `@tailwindcss/postcss` en `postcss.config.mjs`.
- CSS: `@import "tailwindcss"` + `@theme` en `src/app/globals.css`.
- `tailwind.config.ts` enlazado con `@config "../../tailwind.config.ts"` (no es el modelo principal de v4, pero cumple herramientas que aún esperan un config JS).

## Vitest / Playwright

- Unit: `src/__tests__/unit/**/*.test.{ts,tsx}`, jsdom, alias `@`.
- E2E: `src/__tests__/e2e`, Chromium, `webServer` a `next dev` (local) o `next start` (CI).

## `.env.example`

Plantilla de `AUTH_*`, `DATABASE_URL` y URL pública. Copia a `.env` y no la subas a git.

## `.gitignore`

Cubre Next, env, coverage, Playwright, cliente generado de Prisma y `.vercel`.
