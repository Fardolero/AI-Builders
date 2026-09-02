# Migraciones de Prisma

Las migraciones viven en este directorio y **deben versionarse en Git**.

## Flujo local

1. Cambia `prisma/schema.prisma`.
2. Ejecuta `npm run db:migrate` (`prisma migrate dev`) y escribe un nombre descriptivo (`add_posts_status`).
3. Commit del SQL generado junto con el schema.

## Producción (Vercel)

En el build o en un job de release:

```bash
npx prisma migrate deploy
```

`migrate deploy` aplica migraciones pendientes **sin** crear otras nuevas. No uses `migrate dev` en CI/producción.

## Primera vez en una base vacía

```bash
cp .env.example .env
# edita DATABASE_URL
npx prisma migrate deploy
npx prisma generate
```
