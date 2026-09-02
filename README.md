# AI Builders — Next.js 15 Starter

Starter **production-ready** con Next.js 15 (App Router), TypeScript estricto, Tailwind CSS v4, Auth.js (NextAuth v5), Prisma/PostgreSQL, Vitest y Playwright. Incluye pipeline de GitHub Actions y guía de despliegue en Vercel.

## Stack

| Área | Tecnología |
| --- | --- |
| Framework | Next.js 15, App Router, `src/` |
| Lenguaje | TypeScript (`strict` + `noUncheckedIndexedAccess`) |
| Estilos | Tailwind CSS v4, `clsx` + `tailwind-merge` (`cn()`), Lucide |
| Lint/format | ESLint (`next/core-web-vitals`) + Prettier (`eslint-config-prettier` al final) |
| Auth | Auth.js v5 (`next-auth@beta`; `latest` en npm sigue siendo v4), GitHub OAuth, Prisma Adapter, JWT |
| Datos | Prisma ORM **6** + PostgreSQL, migraciones versionadas |
| Tests | Vitest (unit) + Playwright (E2E) |
| Deploy | Vercel + GitHub Actions |

## Arranque rápido (este repositorio)

```bash
# Windows (PowerShell)
.\scripts\init-nextjs-project.ps1

# macOS / Linux / Git Bash
chmod +x scripts/init-nextjs-project.sh
./scripts/init-nextjs-project.sh
```

O a mano:

```bash
cp .env.example .env
npm install
npx prisma generate
npx playwright install chromium
npm run dev
```

Crea un proyecto **nuevo** copiando este starter:

```bash
./scripts/init-nextjs-project.sh ../mi-app
# PowerShell:
# .\scripts\init-nextjs-project.ps1 ..\mi-app
```

Desde cero con `create-next-app` (sin copiar el kit): ver [scripts/init-from-scratch.sh](scripts/init-from-scratch.sh).

## Scripts npm

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` / `start` | Build de producción y servidor |
| `npm run lint` / `format` | ESLint y Prettier |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest (unit) |
| `npm run test:e2e` | Playwright |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:migrate:deploy` | `prisma migrate deploy` (prod) |

## Estructura

```
src/
├── app/
│   ├── api/                 # Route Handlers (/api/health, /api/posts, /api/auth)
│   └── (routes)/            # Páginas (home, login, dashboard)
├── components/
│   ├── ui/                  # Primitivos (Button)
│   └── shared/              # Providers, auth UI
├── lib/                     # cn(), Prisma, schemas Zod
├── hooks/
├── types/
├── constants/
├── __tests__/
│   ├── unit/
│   └── e2e/
├── auth.ts                  # NextAuth + Prisma (Node)
├── auth.config.ts           # Config Edge-safe
└── middleware.ts
```

## Documentación

1. [Vercel + GitHub (CI/CD y env vars)](docs/vercel-github.md)
2. [Testing (local, CI, convenciones)](docs/testing.md)
3. [Autenticación y base de datos](docs/auth-database.md)
4. [Archivos de configuración (referencia)](docs/config-reference.md)

## Notas de diseño

- **Tailwind v4** se configura en CSS (`@import "tailwindcss"` + `@theme`). `tailwind.config.ts` queda como puente con `@config` para IntelliSense.
- **ESLint 9** usa `eslint.config.mjs` (Next.js 15). `.eslintrc.json` está incluido como equivalente legado; ESLint 9 ignora eslintrc si existe flat config.
- **Middleware** importa solo `auth.config.ts` (sin Prisma) para no romper el runtime Edge.
- Las migraciones de Prisma **se commitean**. En producción usa `prisma migrate deploy`.
