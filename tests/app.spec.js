import { test, expect } from "@playwright/test";

test.describe("RotMG Dungeon Timer", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
    });
    await page.goto("/");
    await expect(page.locator("#app-version")).toContainText("v2.8.1");
  });

  test("loads the timer page with dungeon picker", async ({ page }) => {
    await expect(page).toHaveTitle("RotMG Timer");
    await expect(page.getByRole("heading", { name: "RotMG Timer" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Start" })).toBeVisible();
    await expect(page.locator("#dungeon-name")).toContainText("Lost Halls");
  });

  test("navigates between tabs", async ({ page }) => {
    await page.locator('.tab[data-page="overview"]').click();
    await expect(page).toHaveTitle(/Overview/);
    await expect(page.locator("#page-overview")).toBeVisible();
    await expect(page.locator("#page-timer")).toBeHidden();

    await page.locator('.tab[data-page="times"]').click();
    await expect(page).toHaveTitle(/Times/);
    await expect(page.locator("#page-times")).toBeVisible();

    await page.locator('.tab[data-page="leaderboard"]').click();
    await expect(page).toHaveTitle(/Board/);
    await expect(page.locator("#page-leaderboard")).toBeVisible();
  });

  test("updates URL segments when switching tabs", async ({ page }) => {
    await page.locator('.tab[data-page="times"]').click();
    await expect(page).toHaveURL(/\/Times$/);

    await page.locator('.tab[data-page="about"]').click();
    await expect(page).toHaveURL(/\/About$/);
  });

  test("shows version footer", async ({ page }) => {
    await expect(page.locator("#app-version")).toContainText("v2.8.1");
  });

  test("filters dungeons in the active category tab", async ({ page }) => {
    await page.locator('.category-tab[data-category="realm"]').click();
    await page.getByPlaceholder("Search this tab").fill("puppet");
    await expect(page.locator("#dungeon-grid button")).toHaveCount(2);
  });
});
