import { expect, test } from "@playwright/test";

test.describe("home", () => {
  test("muestra la landing Trocar con cómo funciona", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Trocar").first()).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Intercambiá sin dinero/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Cómo funciona/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Lo último en la ciudad/i }),
    ).toBeVisible();
  });
});
