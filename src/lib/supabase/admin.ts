import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabase/env";

/** Server-only client — bypasses RLS. Never import from client components. */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey || serviceRoleKey.includes("your-service-role-key")) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is missing or still a placeholder in .env.local. Copy the service_role key from Supabase → Project Settings → API."
    );
  }

  const { url } = getSupabaseEnv();
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
