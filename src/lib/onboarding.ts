const DEFAULT_JOIN_PATH = "/join";

export function buildManagerInviteUrl(token: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  const path = `${DEFAULT_JOIN_PATH}?token=${encodeURIComponent(token)}`;
  return base ? `${base}${path}` : path;
}

export function generateInviteToken(playerId: string): string {
  return `mgr_${playerId}_${Date.now().toString(36)}`;
}

export const MANAGER_INVITE_DESCRIPTION =
  "Creates their app profile, links to this player, and enables fantasy manager access.";

export const NOTIFY_MESSAGE_TEMPLATE = (gw: number, deadline: string) =>
  `GW${String(gw).padStart(2, "0")} is open — pick your 5 before ${deadline} tonight.`;
