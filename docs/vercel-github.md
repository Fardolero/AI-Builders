# Vercel + GitHub

Despliegue automático en cada push a `main` y checks de calidad en PRs.

## 1. Repositorio GitHub

```bash
git init
git add .
git commit -m "chore: bootstrap Next.js 15 starter"
git branch -M main
git remote add origin git@github.com:ORG/REPO.git
git push -u origin main
```

No subas `.env`. Sí versiona `.env.example` y `prisma/migrations/`.

## 2. Conectar Vercel

1. Entra en [vercel.com](https://vercel.com) e inicia sesión con GitHub.
2. **Add New… → Project** y selecciona el repositorio.
3. Framework Preset: **Next.js**. Root Directory: `.`
4. Build Command: `prisma generate && next build` (o deja el script `npm run build`).
5. Install Command: `npm ci`
6. Node.js: **20.x**
7. Pulsa **Deploy** (fallará el primer intento si faltan env vars; configúralas y redespliega).

Vercel crea un deploy de **Production** en `main`/`master` y **Preview** en cada PR/rama.

## 3. Variables de entorno en Vercel

Project → **Settings → Environment Variables**. Aplica Production, Preview y Development según corresponda.

| Variable | Obligatoria | Notas |
| --- | --- | --- |
| `AUTH_SECRET` | Sí | `npx auth secret` o `openssl rand -base64 32` |
| `AUTH_URL` | Sí (prod) | URL canónica, p. ej. `https://tu-app.vercel.app` |
| `AUTH_TRUST_HOST` | Recomendado | `true` detrás del proxy de Vercel |
| `AUTH_GITHUB_ID` | Sí (OAuth) | GitHub OAuth App |
| `AUTH_GITHUB_SECRET` | Sí (OAuth) | GitHub OAuth App |
| `DATABASE_URL` | Sí | Connection string PostgreSQL (pooled OK para runtime) |
| `DIRECT_URL` | Si usas pooler | URL directa para migraciones (Neon/Supabase) |
| `NEXT_PUBLIC_APP_URL` | Recomendado | Misma URL pública |

Tras cambiar env vars: **Deployments → Redeploy**.

### GitHub OAuth App

1. GitHub → Settings → Developer settings → **OAuth Apps → New**.
2. Homepage: `https://tu-app.vercel.app`
3. Authorization callback URL: `https://tu-app.vercel.app/api/auth/callback/github`
4. En local añade también `http://localhost:3000/api/auth/callback/github` (otra OAuth App de desarrollo es más limpio).

## 4. Base de datos en producción

Opciones habituales: [Neon](https://neon.tech), [Supabase](https://supabase.com), [Vercel Postgres](https://vercel.com/storage/postgres).

Flujo de migraciones:

```bash
# Local: crea SQL versionado
npm run db:migrate

git add prisma/schema.prisma prisma/migrations
git commit -m "feat(db): add posts status"
git push
```

En Vercel, ejecuta **una vez** (o en un job de release):

```bash
npx prisma migrate deploy
```

Puedes añadirlo al build (`prisma migrate deploy && prisma generate && next build`) solo si aceptas que cada deploy aplique migraciones. En equipos grandes es más seguro un job manual o un workflow `workflow_dispatch`.

## 5. CI/CD (GitHub Actions)

El workflow [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) corre en **push a main** y en **pull_request**:

1. `npm ci`
2. `prisma generate`
3. `lint` → `format:check` → `typecheck` → `vitest`
4. Job E2E: `next build` + Playwright (Chromium)

Vercel no espera a GitHub Actions por defecto. Para **bloquear merge** si CI falla: GitHub → Settings → Branches → rule en `main` → Require status checks (`quality`, `e2e`).

Para bloquear el deploy de producción hasta que pase CI, usa [Vercel Deployment Checks](https://vercel.com/docs/projects/project-configuration#git) o espera al check de GitHub antes de mergear.

## 6. Secretos en GitHub Actions (opcional)

Si más adelante los E2E golpean OAuth o una DB real, añade secrets en el repo:

- `AUTH_SECRET`
- `DATABASE_URL` (DB de CI, nunca producción)
- `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` (app de test)

Los tests unitarios y el health check de este starter **no** necesitan una PostgreSQL viva.
