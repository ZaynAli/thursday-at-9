import { createClient } from "@supabase/supabase-js";
import type { Page } from "@playwright/test";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} for Playwright auth helper`);
  return value;
}

/** Generate a one-time magic link (same as `npm run auth:link`). */
export async function generateMagicLink(email: string): Promise<string> {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    ""
  );

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: email.trim().toLowerCase(),
    options: {
      redirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error) {
    throw new Error(`generateLink failed: ${error.message}`);
  }

  const actionLink = data.properties?.action_link;
  if (!actionLink) {
    throw new Error("generateLink returned no action_link");
  }

  return actionLink;
}

/** Sign in via magic link and wait until the app leaves `/auth/callback`. */
export async function signInWithMagicLink(page: Page, email: string): Promise<void> {
  const link = await generateMagicLink(email);
  await page.goto(link);
  await page.waitForURL(
    (url) => !url.pathname.startsWith("/auth/callback"),
    { timeout: 20_000 }
  );
}
