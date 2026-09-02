# Inicializa un proyecto Next.js 15 production-ready.
# Uso (PowerShell):
#   .\scripts\init-nextjs-project.ps1 [[-Target] ruta]
param(
  [string]$Target = "."
)

$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
if ($Target -eq ".") {
  $Dest = $Root
} else {
  New-Item -ItemType Directory -Force -Path $Target | Out-Null
  $Dest = Resolve-Path $Target
}

Write-Host "==> Destino: $Dest"

if ((-not (Test-Path (Join-Path $Dest "package.json"))) -and ($Dest.Path -ne $Root.Path)) {
  Write-Host "==> Copiando starter"
  $exclude = @(".git", "node_modules", ".next", "coverage", "playwright-report", "test-results")
  Get-ChildItem -Force $Root | Where-Object { $exclude -notcontains $_.Name } | ForEach-Object {
    Copy-Item -Recurse -Force $_.FullName (Join-Path $Dest $_.Name)
  }
}

Set-Location $Dest

if ((-not (Test-Path ".env")) -and (Test-Path ".env.example")) {
  Copy-Item ".env.example" ".env"
  Write-Host "==> Creado .env desde .env.example"
}

Write-Host "==> Instalando dependencias"
npm install next@15 react@19 react-dom@19 `
  lucide-react clsx tailwind-merge `
  next-auth@beta @auth/prisma-adapter `
  @prisma/client@6 zod

npm install -D typescript@5 @types/node @types/react @types/react-dom `
  tailwindcss @tailwindcss/postcss postcss `
  eslint eslint-config-next@15 @eslint/eslintrc eslint-config-prettier `
  prettier prettier-plugin-tailwindcss `
  prisma@6 `
  vitest @vitejs/plugin-react jsdom @vitest/coverage-v8 `
  @testing-library/react @testing-library/jest-dom @testing-library/user-event `
  @playwright/test `
  eslint-plugin-react-hooks

Write-Host "==> Generando cliente Prisma"
npx prisma generate

if ($env:SKIP_PLAYWRIGHT -ne "1") {
  Write-Host "==> Instalando Chromium para Playwright"
  npx playwright install chromium
}

Write-Host ""
Write-Host "Listo. Siguientes pasos:"
Write-Host "  1. Editar .env (AUTH_SECRET, DATABASE_URL, AUTH_GITHUB_*)"
Write-Host "  2. npx auth secret"
Write-Host "  3. npm run db:migrate"
Write-Host "  4. npm run dev"
