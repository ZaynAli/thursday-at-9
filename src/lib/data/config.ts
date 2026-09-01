import { isSupabaseConfigured } from "@/lib/supabase/env";

export type DataSource = "mock" | "supabase";

/** Use mock data when explicitly set or Supabase env is missing. */
export function useMockData(): boolean {
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true") return true;
  return !isSupabaseConfigured();
}

export function getDataSource(): DataSource {
  return useMockData() ? "mock" : "supabase";
}
