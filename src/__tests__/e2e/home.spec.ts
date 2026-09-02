import { expect, test } from "@playwright/test";

test.describe("home", () => {
  test("muestra el título principal", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /Next\.js 15 listo para producción/i }),
    ).toBeVisible();
  });
});
