"use server";

import { cookies } from "next/headers";
import { acceptManagerInvite, InviteAcceptError } from "@/lib/auth/accept-invite.server";
import {
  AUTH_INVITE_COOKIE,
  AUTH_REDIRECT_COOKIE,
  sanitizeRedirectPath,
} from "@/lib/auth/pending-redirect";
import { userNeedsPasswordSetup } from "@/lib/auth/password";
import { createClient } from "@/lib/supabase/server";

function redirectAfterAuth(next: string): string {
  return `/login/set-password?next=${encodeURIComponent(next)}`;
}

export async function finalizeAuthCallback(): Promise<{ redirectTo: string }> {
  const cookieStore = await cookies();
  const next = sanitizeRedirectPath(cookieStore.get(AUTH_REDIRECT_COOKIE)?.value);
  const invite = cookieStore.get(AUTH_INVITE_COOKIE)?.value;

  cookieStore.delete(AUTH_REDIRECT_COOKIE);
  cookieStore.delete(AUTH_INVITE_COOKIE);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (invite && user) {
    try {
      await acceptManagerInvite(invite, user.id);
    } catch (err) {
      const message =
        err instanceof InviteAcceptError ? err.message : "Could not accept invite.";
      const params = new URLSearchParams({
        token: invite,
        error: message,
      });
      return { redirectTo: `/join?${params.toString()}` };
    }
  }

  if (user && userNeedsPasswordSetup(user)) {
    return { redirectTo: redirectAfterAuth(next) };
  }

  return { redirectTo: next };
}
