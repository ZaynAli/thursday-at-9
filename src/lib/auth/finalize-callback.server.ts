"use server";

import { cookies } from "next/headers";
import {
  AUTH_INVITE_COOKIE,
  AUTH_REDIRECT_COOKIE,
} from "@/lib/auth/pending-redirect";
import { resolveAuthCallbackRedirect } from "@/lib/auth/finalize-callback";
import { createClient } from "@/lib/supabase/server";

/** Client-side callback fallback — may delete pending-auth cookies. */
export async function finalizeAuthCallback(options?: {
  inviteToken?: string | null;
  redirectPath?: string | null;
}): Promise<{ redirectTo: string }> {
  const cookieStore = await cookies();
  const redirectPath =
    options?.redirectPath ?? cookieStore.get(AUTH_REDIRECT_COOKIE)?.value;
  const inviteToken =
    options?.inviteToken ?? cookieStore.get(AUTH_INVITE_COOKIE)?.value;

  cookieStore.delete(AUTH_REDIRECT_COOKIE);
  cookieStore.delete(AUTH_INVITE_COOKIE);

  const supabase = await createClient();
  const redirectTo = await resolveAuthCallbackRedirect({
    supabase,
    redirectPath,
    inviteToken,
  });

  return { redirectTo };
}
