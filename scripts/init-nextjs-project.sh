#!/usr/bin/env bash
# Inicializa un proyecto Next.js 15 production-ready (App Router, TS estricto,
# Tailwind v4, Auth.js v5, Prisma, Vitest, Playwright).
#
# Uso:
#   ./scripts/init-nextjs-project.sh [directorio-destino]
#
# Requisitos: Node.js >= 20.11, npm, git
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET="${1:-.}"

if [[ "$TARGET" != "." ]]; then
  mkdir -p "$TARGET"
  TARGET="$(cd "$TARGET" && pwd)"
else
  TARGET="$ROOT"
fi

echo "==> Destino: $TARGET"

if [[ ! -f "$TARGET/package.json" && "$TARGET" != "$ROOT" ]]; then
  echo "==> Copiando starter desde $ROOT"
  if command -v rsync >/dev/null 2>&1; then
    rsync -a \
      --exclude ".git" \
      --exclude "node_modules" \
      --exclude ".next" \
      --exclude "coverage" \
      --exclude "playwright-report" \
      --exclude "test-results" \
      "$ROOT/" "$TARGET/"
  else
    # Fallback portable (Git Bash / macOS sin rsync)
    find "$ROOT" -mindepth 1 -maxdepth 1 \
      ! -name ".git" \
      ! -name "node_modules" \
      ! -name ".next" \
      -exec cp -R {} "$TARGET/" \;
  fi
fi

cd "$TARGET"

if [[ ! -f .env && -f .env.example ]]; then
  cp .env.example .env
  echo "==> Creado .env desde .env.example (edita secretos antes de auth/DB)"
fi

echo "==> Instalando dependencias"
npm install next@15 react@19 react-dom@19 \
  lucide-react clsx tailwind-merge \
  next-auth@beta @auth/prisma-adapter \
  @prisma/client@6 zod

npm install -D typescript@5 @types/node @types/react @types/react-dom \
  tailwindcss @tailwindcss/postcss postcss \
  eslint eslint-config-next@15 @eslint/eslintrc eslint-config-prettier \
  prettier prettier-plugin-tailwindcss \
  prisma@6 \
  vitest @vitejs/plugin-react jsdom @vitest/coverage-v8 \
  @testing-library/react @testing-library/jest-dom @testing-library/user-event \
  @playwright/test \
  eslint-plugin-react-hooks

echo "==> Generando cliente Prisma"
npx prisma generate || echo "Aviso: prisma generate requiere schema.prisma"

echo "==> Instalando Chromium para Playwright (opcional: omitir con SKIP_PLAYWRIGHT=1)"
if [[ "${SKIP_PLAYWRIGHT:-0}" != "1" ]]; then
  npx playwright install chromium
fi

echo
echo "Listo. Siguientes pasos:"
echo "  1. Editar .env (AUTH_SECRET, DATABASE_URL, AUTH_GITHUB_*)"
echo "  2. npx auth secret   # escribe AUTH_SECRET"
echo "  3. npm run db:migrate"
echo "  4. npm run dev"
echo
echo "Docs: README.md, docs/vercel-github.md, docs/testing.md, docs/auth-database.md"
