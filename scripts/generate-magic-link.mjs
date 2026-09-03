#!/usr/bin/env node
/**
 * Generate a one-time setup link without sending email (bypasses Supabase SMTP rate limit).
 *
 * Usage:
 *   npm run auth:link -- your@email.com --local
 *   npm run auth:link -- your@email.com --production
 *   npm run auth:link -- your@email.com --url https://thursday-at-9.vercel.app
 *
 * Opens directly on /auth/callback so the server can set session cookies.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in .env.local
 * For --production, set PRODUCTION_SITE_URL in .env.local or pass --url.
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

function getFlagValue(name) {
  const argv = process.argv.slice(2);
  const idx = argv.indexOf(name);
  if (idx !== -1 && argv[idx + 1] && !argv[idx + 1].startsWith("-")) {
    return argv[idx + 1];
  }
  const prefixed = argv.find((arg) => arg.startsWith(`${name}=`));
  if (prefixed) return prefixed.slice(name.length + 1);
  return null;
}

function isLocalOrigin(origin) {
  try {
    const { hostname } = new URL(origin);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

function normalizeOrigin(origin) {
  return origin.replace(/\/$/, "");
}

function resolveSiteUrl({ flags, explicitUrl, configuredSiteUrl }) {
  if (flags.has("--local")) {
    return "http://localhost:3000";
  }

  if (explicitUrl) {
    return normalizeOrigin(explicitUrl);
  }

  if (flags.has("--production")) {
    const candidates = [
      process.env.PRODUCTION_SITE_URL,
      configuredSiteUrl && !isLocalOrigin(configuredSiteUrl) ? configuredSiteUrl : null,
    ].filter(Boolean);

    if (candidates.length === 0) {
      console.error(
        [
          "Production URL not configured.",
          "",
          "Add to .env.local:",
          "  PRODUCTION_SITE_URL=https://thursday-at-9.vercel.app",
          "",
          "Or pass explicitly:",
          "  npm run auth:link -- your@email.com --production --url https://thursday-at-9.vercel.app",
        ].join("\n")
      );
      process.exit(1);
    }

    return normalizeOrigin(candidates[0]);
  }

  if (configuredSiteUrl && !isLocalOrigin(configuredSiteUrl)) {
    return configuredSiteUrl;
  }

  console.warn(
    "Defaulting to http://localhost:3000. Pass --production or --url for deployed app.\n"
  );
  return "http://localhost:3000";
}

loadEnvLocal();

const argv = process.argv.slice(2);
const flags = new Set(argv.filter((arg) => arg.startsWith("-") && !arg.includes("@")));
const args = argv.filter(
  (arg) =>
    !arg.startsWith("-") &&
    arg !== getFlagValue("--url")
);
const explicitUrl = getFlagValue("--url");

const email = args[0]?.trim().toLowerCase();
const inviteToken = args[1]?.trim();

if (!email || !email.includes("@")) {
  console.error(
    "Usage: npm run auth:link -- your@email.com [--local|--production] [--url https://your-app.vercel.app]"
  );
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const configuredSiteUrl = normalizeOrigin(
  process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? ""
);

const siteUrl = resolveSiteUrl({ flags, explicitUrl, configuredSiteUrl });

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

let hashedToken = data?.properties?.hashed_token;
let verificationType = "email";

if (error || !hashedToken) {
  // Ensure auth user exists for brand-new emails, then retry.
  const created = await supabase.auth.admin.createUser({
    email,
    email_confirm: false,
  });
  if (created.error && !/already|exists/i.test(created.error.message)) {
    console.error("Failed to generate link:", error?.message ?? created.error.message);
    process.exit(1);
  }

  const retry = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: {
      redirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (retry.error) {
    console.error("Failed to generate link:", retry.error.message);
    process.exit(1);
  }

  hashedToken = retry.data.properties?.hashed_token;
  verificationType = "email";
}

if (!hashedToken) {
  console.error("No token returned:", JSON.stringify(data, null, 2));
  process.exit(1);
}

const setupLink = buildAuthCallbackUrl(siteUrl, hashedToken, verificationType);

console.log(`\nTarget app: ${siteUrl}`);
if (isLocalOrigin(siteUrl)) {
  console.log("Local link — open while `npm run dev` is running.\n");
} else {
  console.log("Production link — open in a browser.\n");
}
console.log("Setup link (single use):\n");
console.log(setupLink);
console.log(
  [
    "",
    "Important:",
    "• The page will ask them to tap “Continue” — that is intentional.",
    "• Do not open/preview the link yourself first (iMessage/Slack previews burn it).",
    "• Prefer pasting the link into a notes app, or have them open it once.",
    "",
  ].join("\n")
);

if (inviteToken) {
  console.log(
    `Invite token provided. Prefer /join?token=${inviteToken} so invite cookies are set.\n`
  );
} else {
  console.log("After opening the link, choose a password if prompted.\n");
}
