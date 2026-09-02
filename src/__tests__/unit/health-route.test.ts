import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  it("responde status ok", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      status: string;
      timestamp: string;
      githubOAuthConfigured: boolean;
    };
    expect(body.status).toBe("ok");
    expect(typeof body.timestamp).toBe("string");
    expect(typeof body.githubOAuthConfigured).toBe("boolean");
  });
});
