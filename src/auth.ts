import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";

function shouldUsePrismaAdapter() {
  if (process.env.AUTH_ADAPTER === "true") {
    return true;
  }
  if (process.env.AUTH_ADAPTER === "false") {
    return false;
  }

  const databaseUrl = process.env.DATABASE_URL ?? "";
  const isLocalhost = /localhost|127\.0\.0\.1/.test(databaseUrl);
  return Boolean(databaseUrl) && !isLocalhost;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  ...(shouldUsePrismaAdapter() ? { adapter: PrismaAdapter(prisma) } : {}),
  session: { strategy: "jwt" },
});
