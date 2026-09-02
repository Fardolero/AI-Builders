import { NextResponse } from "next/server";
import { isGitHubOAuthConfigured } from "@/lib/github-oauth";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    githubOAuthConfigured: isGitHubOAuthConfigured(),
  });
}

