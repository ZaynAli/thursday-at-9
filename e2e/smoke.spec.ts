import { test, expect } from "@playwright/test";
import { LEAGUE_NAME } from "../src/lib/constants";

test.describe("public pages (mock data)", () => {
  test("home loads gameweek header", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("main").getByText(LEAGUE_NAME)).toBeVisible();
    await expect(page.getByRole("main").getByText("Gameweek", { exact: true })).toBeVisible();
  });

  test("league standings page loads", async ({ page }) => {
    await page.goto("/league");
    await expect(page.getByRole("heading", { name: "League" })).toBeVisible();
  });

  test("fantasy page loads", async ({ page }) => {
    await page.goto("/fantasy");
    // In mock mode user is signed in, so we see the fantasy UI
    await expect(page.locator("main")).toBeVisible();
  });

  test("login page renders or redirects home (mock has user)", async ({ page }) => {
    await page.goto("/login");
    // Mock mode auto-signs in → redirects home; real mode shows form
    await expect(page.locator("main")).toBeVisible();
  });

  test("league manager detail page loads", async ({ page }) => {
    await page.goto("/league/ramis");
    await expect(page.getByRole("heading", { name: "Ramis" })).toBeVisible();
  });
});
