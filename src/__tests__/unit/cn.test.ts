import { describe, expect, it } from "vitest";
import { cn } from "@/lib/cn";

describe("cn", () => {
  it("concatena clases", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  it("resuelve conflictos de Tailwind con tailwind-merge", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("omite valores falsy", () => {
    expect(cn("block", false && "hidden", undefined, "text-sm")).toBe("block text-sm");
  });
});
