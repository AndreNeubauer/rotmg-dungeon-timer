import { test, expect } from "@playwright/test";

test.describe("RotMG Dungeon Timer", () => {
  test("timer home loads catalog and controls", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "RotMG Dungeon Timer" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Start" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Recent runs" })).toBeVisible();
  });

  test("main navigation reaches About", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "About" }).click();
    await expect(page).toHaveURL(/\/about\/?$/);
    await expect(page.getByRole("heading", { name: "What this is" })).toBeVisible();
  });

  test("overview and times pages render", async ({ page }) => {
    await page.goto("/overview/");
    await expect(page.getByText("Exalt attempts")).toBeVisible();

    await page.goto("/times/");
    await expect(page.getByRole("button", { name: "Export" })).toBeVisible();
  });
});
