import { test, expect } from "@playwright/test";
import { hasSupabaseTestEnv } from "./helpers/env";
import { signInWithMagicLink, completePasswordSetupIfNeeded } from "./helpers/auth";

const testEmail = process.env.PLAYWRIGHT_TEST_EMAIL?.trim().toLowerCase();

test.describe("Supabase auth", () => {
  test.skip(
    !hasSupabaseTestEnv(),
    "Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and PLAYWRIGHT_TEST_EMAIL in .env.local"
  );

  test.use({
    // Real Supabase reads/writes — opt out of mock mode for this file.
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000",
  });

  test("magic link sign-in lands on home", async ({ page }) => {
    test.skip(!testEmail, "PLAYWRIGHT_TEST_EMAIL is empty");

    await signInWithMagicLink(page, testEmail!);
    await completePasswordSetupIfNeeded(page);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByText(/sign in to pick teams/i)).not.toBeVisible();
  });

  test("password sign-in works after setup", async ({ page }) => {
    test.skip(!testEmail, "PLAYWRIGHT_TEST_EMAIL is empty");

    const password = process.env.PLAYWRIGHT_TEST_PASSWORD ?? "test-password-123";

    await signInWithMagicLink(page, testEmail!);
    await completePasswordSetupIfNeeded(page, password);

    await page.context().clearCookies();
    await page.goto("/login");
    await page.getByLabel("Email").fill(testEmail!);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByText(/sign in to pick teams/i)).not.toBeVisible();
  });
});
