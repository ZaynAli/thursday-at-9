import { test, expect } from "@playwright/test";
import { LEAGUE_NAME } from "../src/lib/constants";

test.describe("public pages (mock data)", () => {
  test("home loads gameweek header", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("main").getByText(LEAGUE_NAME)).toBeVisible();
    await expect(page.getByRole("main").getByText("Gameweek", { exact: true })).toBeVisible();
  });

  test("login page shows sign-in form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  test("fantasy page prompts unauthenticated users", async ({ page }) => {
    await page.goto("/fantasy");
    await expect(page.getByText("Sign in required")).toBeVisible();
  });

  test("league standings page loads", async ({ page }) => {
    await page.goto("/league");
    await expect(page.getByRole("heading", { name: "League" })).toBeVisible();
  });

  test("unauthenticated user sees sign-in prompt on home", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByText(/sign in to pick teams/i)
    ).toBeVisible();
  });
});
