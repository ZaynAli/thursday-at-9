"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  AUTH_INVITE_COOKIE,
  AUTH_REDIRECT_COOKIE,
  authPendingCookieOptions,
  sanitizeRedirectPath,
} from "@/lib/auth/pending-redirect";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { generateDevMagicLink } from "@/lib/auth/dev-link.server";
import { useMockData } from "@/lib/data/config";

export async function setAuthRedirectCookies(
  redirectTo: string,
  inviteToken?: string
): Promise<void> {
  const cookieStore = await cookies();
  const options = authPendingCookieOptions();

  cookieStore.set(
    AUTH_REDIRECT_COOKIE,
    sanitizeRedirectPath(redirectTo),
    options
  );

  if (inviteToken) {
    cookieStore.set(AUTH_INVITE_COOKIE, inviteToken, options);
  } else {
    cookieStore.delete(AUTH_INVITE_COOKIE);
  }
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}

export type SignInState =
  | { status: "idle" }
  | { status: "success"; email: string }
  | { status: "error"; message: string };

export type DevLinkResult =
  | { ok: true; link: string }
  | { ok: false; error: string };

/** Dev only — generates a magic link via admin API (no email, no rate limit). */
export async function generateDevMagicLinkAction(
  email: string,
  redirectTo = "/",
  inviteToken?: string
): Promise<DevLinkResult> {
  if (process.env.NODE_ENV !== "development") {
    return { ok: false, error: "Dev sign-in links are only available in development." };
  }
  if (useMockData()) {
    return { ok: false, error: "Supabase is not configured." };
  }

  try {
    await setAuthRedirectCookies(redirectTo, inviteToken);
    const link = await generateDevMagicLink(email);
    return { ok: true, link };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not generate link.",
    };
  }
}
