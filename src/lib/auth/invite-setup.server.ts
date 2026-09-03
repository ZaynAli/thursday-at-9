"use server";

import { createClient } from "@/lib/supabase/server";
import {
  buildAuthCallbackRedirectUrl,
  resolveAuthEmailOrigin,
} from "@/lib/auth/site-url";
import { setAuthRedirectCookies } from "@/lib/auth/actions";

export type InviteSetupLinkResult =
  | { ok: true }
  | { ok: false; error: string };

export async function sendInviteSetupLinkAction(
  email: string,
  inviteToken: string,
  redirectTo = "/"
): Promise<InviteSetupLinkResult> {
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes("@")) {
    return { ok: false, error: "Enter a valid email address." };
  }

  if (!inviteToken.trim()) {
    return { ok: false, error: "Invite token is missing. Open your invite link again." };
  }

  try {
    await setAuthRedirectCookies(redirectTo, inviteToken);

    const origin = await resolveAuthEmailOrigin();
    const emailRedirectTo = buildAuthCallbackRedirectUrl(origin, {
      inviteToken,
      next: redirectTo,
    });

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: normalized,
      options: {
        emailRedirectTo,
        shouldCreateUser: true,
      },
    });

    if (error) {
      const isRateLimit = error.message.toLowerCase().includes("rate limit");
      const message = isRateLimit
        ? "Email rate limit reached (~2/hour on Supabase's built-in email). Ask the admin to run `npm run auth:link -- your@email.com --production` and send you that link instead."
        : error.message;
      return { ok: false, error: message };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "Could not send setup link. Try again." };
  }
}
