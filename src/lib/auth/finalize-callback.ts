import { acceptManagerInvite, InviteAcceptError } from "@/lib/auth/accept-invite.server";
import { sanitizeRedirectPath } from "@/lib/auth/pending-redirect";
import { userNeedsPasswordSetup } from "@/lib/auth/password";
import type { SupabaseClient } from "@supabase/supabase-js";

function redirectAfterAuth(next: string): string {
  return `/login/set-password?next=${encodeURIComponent(next)}`;
}

export async function resolveAuthCallbackRedirect(options: {
  supabase: SupabaseClient;
  redirectPath?: string | null;
  inviteToken?: string | null;
}): Promise<string> {
  const next = sanitizeRedirectPath(options.redirectPath);
  const invite = options.inviteToken?.trim() || null;

  const {
    data: { user },
  } = await options.supabase.auth.getUser();

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
      return `/join?${params.toString()}`;
    }
  }

  if (user && userNeedsPasswordSetup(user)) {
    return redirectAfterAuth(next);
  }

  return next;
}
