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
    // Brand-new emails sometimes need the user row first.
    const created = await supabase.auth.admin.createUser({
      email: normalized,
      email_confirm: false,
    });
    if (created.error && !/already|exists/i.test(created.error.message)) {
      throw new Error(error.message);
    }

    const retry = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: normalized,
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    });
    if (retry.error) throw new Error(retry.error.message);

    const hashedToken = retry.data.properties?.hashed_token;
    const verificationType = retry.data.properties?.verification_type ?? "email";
    if (!hashedToken) throw new Error("Could not generate setup link.");

    return buildAuthCallbackUrl(origin, hashedToken, verificationType);
  }

  const hashedToken = data.properties?.hashed_token;
  // Prefer universal "email" type so signup + magiclink both verify.
  const verificationType = data.properties?.verification_type ?? "email";

  if (!hashedToken) {
    throw new Error("Could not generate setup link.");
  }

  return buildAuthCallbackUrl(origin, hashedToken, "email");
}
