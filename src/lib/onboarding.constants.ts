export const MANAGER_INVITE_DESCRIPTION =
  "Creates their app profile, links to this player, and enables fantasy manager access.";

export const NOTIFY_MESSAGE_TEMPLATE = (gw: number, deadline: string) =>
  `GW${String(gw).padStart(2, "0")} is open — pick your 5 before ${deadline} tonight.`;
