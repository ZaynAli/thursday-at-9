import type { EmailOtpType } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

/** App callback URL that exchanges an admin-generated token on the server. */
export function buildAuthCallbackUrl(
  siteUrl: string,
  hashedToken: string,
  verificationType: string
): string {
  const origin = siteUrl.replace(/\/$/, "");
  const params = new URLSearchParams({
    token_hash: hashedToken,
    type: verificationType,
  });
  return `${origin}/auth/callback?${params.toString()}`;
}

/**
 * Generate a one-time setup/sign-in link without email.
 * Uses token_hash so our server callback sets session cookies directly —
 * unlike Supabase's action_link, which can redirect to the site root.
 */
export async function generateAdminSetupLink(
  email: string,
  siteUrl: string
): Promise<string> {
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes("@")) {
    throw new Error("Enter a valid email address.");
  }

  const origin = siteUrl.replace(/\/$/, "");
  const supabase = createAdminClient();

  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: normalized,
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  const hashedToken = data.properties?.hashed_token;
  const verificationType = data.properties?.verification_type;

  if (!hashedToken || !verificationType) {
    throw new Error("Could not generate setup link.");
  }

  return buildAuthCallbackUrl(
    origin,
    hashedToken,
    verificationType as EmailOtpType
  );
}
