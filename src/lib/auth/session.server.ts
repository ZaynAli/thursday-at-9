import { userNeedsPasswordSetup } from "@/lib/auth/password";
import { useMockData } from "@/lib/data/config";
import { createClient } from "@/lib/supabase/server";

export async function getAuthUserNeedsPasswordSetup(): Promise<boolean> {
  if (useMockData()) return false;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;
  return userNeedsPasswordSetup(user);
}
