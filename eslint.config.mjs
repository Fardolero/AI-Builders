import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";
import eslintConfigPrettier from "eslint-config-prettier";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

/**
 * Next.js 15 usa Flat Config. `eslint-config-prettier` va al final
 * para apagar reglas de formato que chocan con Prettier.
 */
const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      "src/generated/**",
      "node_modules/**",
      "next-env.d.ts",
    ],
  },
  eslintConfigPrettier,
];

export default eslintConfig;
