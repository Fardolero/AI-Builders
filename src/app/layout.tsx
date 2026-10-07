import type { Metadata } from "next";
import localFont from "next/font/local";
import { Providers } from "@/components/shared/providers";
import { APP_NAME } from "@/constants/routes";
import "./globals.css";

const fraunces = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource/fraunces/files/fraunces-latin-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/fraunces/files/fraunces-latin-600-normal.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/fraunces/files/fraunces-latin-700-normal.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-fraunces",
  display: "swap",
});

const syne = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource/syne/files/syne-latin-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/syne/files/syne-latin-600-normal.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/syne/files/syne-latin-700-normal.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/syne/files/syne-latin-800-normal.woff2",
      weight: "800",
      style: "normal",
    },
  ],
  variable: "--font-syne",
  display: "swap",
});

const dmSans = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource/dm-sans/files/dm-sans-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/dm-sans/files/dm-sans-latin-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/dm-sans/files/dm-sans-latin-600-normal.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/dm-sans/files/dm-sans-latin-700-normal.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-dm-sans",
  display: "swap",
});

const geistMono = localFont({
  src: "../../node_modules/@fontsource/geist-mono/files/geist-mono-latin-400-normal.woff2",
  variable: "--font-geist-mono",
  display: "swap",
  weight: "400",
});

export const metadata: Metadata = {
  title: APP_NAME,
  description:
    "Trocar: intercambiá objetos y servicios con vecinos de tu barrio.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${fraunces.variable} ${syne.variable} ${dmSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
