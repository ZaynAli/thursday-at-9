import type { ManagerInvite, GameweekNotification } from "@/types";
import { buildManagerInviteUrlSync } from "@/lib/onboarding";

/** Pending manager invites — sent from a player's admin page */
export const mockPendingInvites: ManagerInvite[] = [
  {
    id: "inv-hassan",
    playerId: "hassan",
    playerName: "Hassan",
    status: "pending",
    token: "mgr_hassan_static",
    inviteUrl: buildManagerInviteUrlSync("mgr_hassan_static"),
    createdAt: "2026-08-27T09:00:00Z",
    expiresAt: "2026-09-27T09:00:00Z",
  },
];

export const mockGameweekNotifications: GameweekNotification[] = [
  {
    id: "notif-gw7",
    gameweekId: "gw-7",
    gameweekNumber: 7,
    sentAt: "2026-08-21T18:00:00Z",
    sentByName: "Zain",
    recipientCount: 9,
    message: "GW07 is open — pick your 5 before 9:30 PM ET tonight.",
  },
];

export function getPendingInviteForPlayer(
  playerId: string
): ManagerInvite | undefined {
  return mockPendingInvites.find(
    (i) => i.playerId === playerId && i.status === "pending"
  );
}

export function getLatestGameweekNotification(
  gameweekId: string
): GameweekNotification | undefined {
  return mockGameweekNotifications.find((n) => n.gameweekId === gameweekId);
}
