#!/usr/bin/env node
/**
 * Generate a magic link without sending email (bypasses Supabase SMTP rate limit).
 *
 * Usage:
 *   npm run auth:link -- your@email.com
 *   npm run auth:link -- your@email.com INVITE_TOKEN
 *
 * With an invite token, open the generated link in the same browser session
 * after visiting /join?token=INVITE_TOKEN and clicking "Get sign-in link (no email)".
 * Prefer the in-app button on /join — it sets invite cookies automatically.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in .env.local
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnvLocal() {
  const path = resolve(root, ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const email = process.argv[2]?.trim().toLowerCase();
const inviteToken = process.argv[3]?.trim();

if (!email || !email.includes("@")) {
  console.error("Usage: npm run auth:link -- your@email.com [invite-token]");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
  /\/$/,
  ""
);

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await supabase.auth.admin.generateLink({
  type: "magiclink",
  email,
  options: {
    redirectTo: `${siteUrl}/auth/callback`,
  },
});

if (error) {
  console.error("Failed to generate link:", error.message);
  process.exit(1);
}

const actionLink = data.properties?.action_link ?? null;

if (!actionLink) {
  console.error("No link returned:", JSON.stringify(data, null, 2));
  process.exit(1);
}

console.log("\nMagic link (open on this Mac with npm run dev running):\n");
console.log(actionLink);

if (inviteToken) {
  console.log(
    `\nInvite token provided. Use the in-app button on /join?token=${inviteToken} instead — it sets cookies so the invite is accepted after sign-in.\n`
  );
} else {
  console.log("\nExpires in ~1 hour. Single use.\n");
}
