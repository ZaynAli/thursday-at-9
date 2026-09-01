import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export interface SupabaseHealthResult {
  configured: boolean;
  connected: boolean;
  message: string;
}

/** Lightweight connectivity check — used by admin tooling later. */
export async function checkSupabaseHealth(): Promise<SupabaseHealthResult> {
  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      connected: false,
      message: "Supabase env vars missing — app running in mock-data mode.",
    };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.getSession();

    if (error) {
      return {
        configured: true,
        connected: false,
        message: error.message,
      };
    }

    return {
      configured: true,
      connected: true,
      message: "Supabase client initialized.",
    };
  } catch (error) {
    return {
      configured: true,
      connected: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
