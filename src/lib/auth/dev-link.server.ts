import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteUrl } from "@/lib/auth/site-url";

export async function generateDevMagicLink(email: string): Promise<string> {
  if (process.env.NODE_ENV !== "development") {
    throw new Error("Dev magic links are only available in development.");
  }

  const normalized = email.trim().toLowerCase();
  if (!normalized.includes("@")) {
    throw new Error("Enter a valid email address.");
  }

  const supabase = createAdminClient();
  const origin = await getSiteUrl();

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

  const link = data.properties?.action_link;
  if (!link) {
    throw new Error("Could not generate sign-in link.");
  }

  return link;
}
