import { getConfiguredSiteUrl, getSiteUrl } from "@/lib/auth/site-url";

const DEFAULT_JOIN_PATH = "/join";

export async function buildManagerInviteUrl(token: string): Promise<string> {
  const base = await getSiteUrl();
  return `${base}${DEFAULT_JOIN_PATH}?token=${encodeURIComponent(token)}`;
}

/** Sync fallback for mock data (no request headers). */
export function buildManagerInviteUrlSync(token: string): string {
  const base = getConfiguredSiteUrl();
  const path = `${DEFAULT_JOIN_PATH}?token=${encodeURIComponent(token)}`;
  return base ? `${base}${path}` : path;
}

export function generateInviteToken(playerId: string): string {
  return `mgr_${playerId}_${Date.now().toString(36)}`;
}

export {
  MANAGER_INVITE_DESCRIPTION,
  NOTIFY_MESSAGE_TEMPLATE,
} from "@/lib/onboarding.constants";
