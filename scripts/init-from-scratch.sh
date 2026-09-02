#!/usr/bin/env bash
# Crea un proyecto Next.js 15 desde cero (create-next-app) y aplica este kit.
# Uso: ./scripts/init-from-scratch.sh nombre-de-carpeta
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Uso: $0 <nombre-proyecto>"
  exit 1
fi

NAME="$1"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PARENT="$(pwd)"
DEST="$PARENT/$NAME"

if [[ -e "$DEST" ]]; then
  echo "Error: $DEST ya existe"
  exit 1
fi

echo "==> create-next-app@15 (TypeScript, App Router, src/, Tailwind, ESLint)"
npx create-next-app@15 "$NAME" \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --use-npm \
  --turbopack \
  --yes

echo "==> Superponiendo kit production-ready (auth, prisma, tests, CI)"
if command -v rsync >/dev/null 2>&1; then
  rsync -a \
    --exclude ".git" \
    --exclude "node_modules" \
    --exclude ".next" \
    "$ROOT/" "$DEST/"
else
  cp -R "$ROOT/src" "$ROOT/prisma" "$ROOT/docs" "$ROOT/scripts" "$ROOT/.github" "$DEST/" 2>/dev/null || true
  cp "$ROOT/next.config.ts" "$ROOT/tsconfig.json" "$ROOT/vitest.config.ts" \
     "$ROOT/playwright.config.ts" "$ROOT/eslint.config.mjs" "$ROOT/.eslintrc.json" \
     "$ROOT/.prettierrc" "$ROOT/.prettierignore" "$ROOT/.env.example" \
     "$ROOT/.gitignore" "$ROOT/postcss.config.mjs" "$ROOT/tailwind.config.ts" \
     "$ROOT/package.json" "$DEST/"
fi

cd "$DEST"
"$ROOT/scripts/init-nextjs-project.sh" "."

echo "==> Proyecto en $DEST"
