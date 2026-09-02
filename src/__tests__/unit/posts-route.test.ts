import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    post: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { GET, POST } from "@/app/api/posts/route";

const authMock = auth as unknown as Mock;
const findManyMock = prisma.post.findMany as unknown as Mock;

describe("GET /api/posts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devuelve 401 sin sesión", async () => {
    authMock.mockResolvedValue(null);
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it("lista posts del usuario autenticado", async () => {
    authMock.mockResolvedValue({ user: { id: "user_1" } });
    findManyMock.mockResolvedValue([]);
    const response = await GET();
    expect(response.status).toBe(200);
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { authorId: "user_1" },
      }),
    );
  });
});

describe("POST /api/posts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devuelve 422 si el schema falla", async () => {
    authMock.mockResolvedValue({ user: { id: "user_1" } });
    const request = new NextRequest("http://localhost/api/posts", {
      method: "POST",
      body: JSON.stringify({ title: "no", content: "" }),
      headers: { "Content-Type": "application/json" },
    });
    const response = await POST(request);
    expect(response.status).toBe(422);
  });
});
