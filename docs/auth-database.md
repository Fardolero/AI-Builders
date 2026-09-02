# Autenticación y base de datos

## Prisma

### Inicializar (ya hecho en este starter)

```bash
npx prisma init --datasource-provider postgresql
```

Schema: [`prisma/schema.prisma`](../prisma/schema.prisma). Incluye modelos Auth.js (`User`, `Account`, `Session`, `VerificationToken`) y `Post` de ejemplo.

Cliente singleton: [`src/lib/prisma.ts`](../src/lib/prisma.ts).

### Migraciones

```bash
# Desarrollo: crea SQL + aplica + regenerate client
npm run db:migrate

# Aplicar las ya versionadas (CI / prod / compañero nuevo)
npx prisma migrate deploy

# Solo tipos/cliente, sin tocar la DB
npx prisma generate
```

La migración inicial está en `prisma/migrations/20240831000000_init/`. **Commitea siempre** carpetas nuevas de migración.

Si cambias el schema y Prisma pide un reset en local, no lo hagas en una DB compartida. Usa una base de desarrollo propia.

### PostgreSQL local (Docker)

```bash
docker run --name ai-builders-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=ai_builders -p 5432:5432 -d postgres:16
```

`DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_builders?schema=public`

## Auth.js v5 (NextAuth)

Paquetes: `next-auth@beta` (línea v5; `next-auth@latest` sigue siendo v4), `@auth/prisma-adapter`.

| Archivo | Rol |
| --- | --- |
| `src/auth.config.ts` | Providers + callbacks. **Edge-safe** (sin Prisma). |
| `src/auth.ts` | `NextAuth({ adapter, session: jwt })` para Server Components y Route Handlers. |
| `src/app/api/auth/[...nextauth]/route.ts` | `GET`/`POST` handlers. |
| `src/middleware.ts` | Protege `/dashboard/*` importando solo `auth.config`. |
| `src/types/next-auth.d.ts` | `session.user.id`. |

Sesión: **JWT** para no consultar la DB en Edge. El adapter de Prisma se activa cuando `DATABASE_URL` no es localhost (p. ej. Neon en Vercel) o si pones `AUTH_ADAPTER=true`. En local, sin PostgreSQL, el login con GitHub sigue funcionando solo con JWT.

### Secretos

```bash
npx auth secret
# pega el valor en AUTH_SECRET
```

GitHub OAuth: `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`. Callback: `{AUTH_URL}/api/auth/callback/github`.

### Uso en Server Components

```ts
import { auth } from "@/auth";

const session = await auth();
if (!session?.user) redirect("/login");
```

### Ruta API protegida + Zod

[`src/app/api/posts/route.ts`](../src/app/api/posts/route.ts):

1. `auth()` → 401 si no hay usuario.
2. `createPostSchema.safeParse` → 422 si el body es inválido.
3. `prisma.post.create` con `authorId` de la sesión (nunca del cliente).

Ejemplo de llamada autenticada (browser, cookie de sesión):

```ts
await fetch("/api/posts", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    title: "Mi primer post",
    content: "Hola",
    published: false,
  }),
});
```

El middleware **no** sustituye `auth()` en APIs. Valida la sesión otra vez en el handler (defensa en profundidad).

## Checklist primer arranque con auth real

1. PostgreSQL en marcha y `DATABASE_URL` en `.env`.
2. `npx prisma migrate deploy` (o `db:migrate` en local).
3. OAuth App de GitHub + env vars.
4. `AUTH_SECRET` y `AUTH_URL=http://localhost:3000`.
5. `npm run dev` → `/login` → Continuar con GitHub.
6. Tras el callback, `/dashboard` debe cargar; `POST /api/posts` debe devolver 201.
