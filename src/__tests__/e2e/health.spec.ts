import { expect, test } from "@playwright/test";

test.describe("API health", () => {
  test("GET /api/health responde ok", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.ok()).toBeTruthy();
    const body = (await response.json()) as { status: string };
    expect(body.status).toBe("ok");
  });
});
