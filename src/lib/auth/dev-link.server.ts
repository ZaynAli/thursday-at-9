import { generateAdminSetupLink } from "@/lib/auth/admin-setup-link.server";
import { getSiteUrl } from "@/lib/auth/site-url";

export async function generateDevMagicLink(email: string): Promise<string> {
  if (process.env.NODE_ENV !== "development") {
    throw new Error("Dev magic links are only available in development.");
  }

  const origin = await getSiteUrl();
  return generateAdminSetupLink(email, origin);
}
