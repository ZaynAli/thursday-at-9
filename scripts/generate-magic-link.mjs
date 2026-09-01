#!/usr/bin/env node
/**
 * Generate a one-time setup link without sending email (bypasses Supabase SMTP rate limit).
 *
 * Usage:
 *   npm run auth:link -- your@email.com
 *   npm run auth:link -- your@email.com --local
 *   npm run auth:link -- your@email.com --production
 *
 * Opens directly on /auth/callback so the server can set session cookies.
 * Use --local when running `npm run dev` on this machine (default if SITE_URL unset).
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

function buildAuthCallbackUrl(siteUrl, hashedToken, verificationType) {
  const origin = siteUrl.replace(/\/$/, "");
  const params = new URLSearchParams({
    token_hash: hashedToken,
    type: verificationType,
  });
  return `${origin}/auth/callback?${params.toString()}`;
}

loadEnvLocal();

const args = process.argv.slice(2).filter((arg) => !arg.startsWith("-"));
const flags = new Set(process.argv.slice(2).filter((arg) => arg.startsWith("-")));

const email = args[0]?.trim().toLowerCase();
const inviteToken = args[1]?.trim();

if (!email || !email.includes("@")) {
  console.error("Usage: npm run auth:link -- your@email.com [--local|--production]");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const configuredSiteUrl = (
  process.env.SITE_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  ""
).replace(/\/$/, "");

let siteUrl = configuredSiteUrl || "http://localhost:3000";
if (flags.has("--local")) {
  siteUrl = "http://localhost:3000";
} else if (flags.has("--production")) {
  if (!configuredSiteUrl) {
    console.error("Set SITE_URL in .env.local to use --production.");
    process.exit(1);
  }
  siteUrl = configuredSiteUrl;
}

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

const hashedToken = data.properties?.hashed_token;
const verificationType = data.properties?.verification_type;

if (!hashedToken || !verificationType) {
  console.error("No token returned:", JSON.stringify(data, null, 2));
  process.exit(1);
}

const setupLink = buildAuthCallbackUrl(siteUrl, hashedToken, verificationType);

console.log(`\nTarget app: ${siteUrl}`);
console.log("(Use --local for npm run dev, or --production for your deployed URL)\n");
console.log("Setup link (single use, ~1 hour):\n");
console.log(setupLink);

if (inviteToken) {
  console.log(
    `\nInvite token provided. Prefer the in-app button on /join?token=${inviteToken} — it stores invite cookies automatically.\n`
  );
} else {
  console.log("\nAfter opening the link, choose a password if prompted.\n");
}
