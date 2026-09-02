import type { Config } from "tailwindcss";

/**
 * Tailwind CSS v4 usa configuración CSS-first (`@theme` en globals.css).
 * Este archivo se mantiene como puente opcional vía `@config` y para
 * herramientas (IntelliSense, class sorting) que aún leen `content`.
 */
const config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
} satisfies Config;

export default config;
