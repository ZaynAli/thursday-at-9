import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/** Load `.env.local` into `process.env` (does not override existing vars). */
export function loadEnvLocal(root = resolve(__dirname, "../..")): void {
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

export function hasSupabaseTestEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.PLAYWRIGHT_TEST_EMAIL
  );
}
