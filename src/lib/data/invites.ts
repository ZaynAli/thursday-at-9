import { useMockData } from "@/lib/data/config";
import {
  getPendingInviteForPlayer as mockGetPendingInviteForPlayer,
  mockPendingInvites,
} from "@/data/mock/invites";
import {
  fetchPendingInviteForPlayer,
  fetchPendingInvites,
  fetchPendingInvitesByPlayerIds,
} from "@/lib/data/invites.server";
import type { ManagerInvite } from "@/types";

export async function getPendingInviteForPlayer(
  playerId: string,
  playerName: string
): Promise<ManagerInvite | undefined> {
  if (useMockData()) return mockGetPendingInviteForPlayer(playerId);
  return fetchPendingInviteForPlayer(playerId, playerName);
}

export async function getPendingInvitesByPlayerIds(
  playerIds: string[],
  playerNames: Map<string, string>
): Promise<Map<string, ManagerInvite>> {
  if (useMockData()) {
    const map = new Map<string, ManagerInvite>();
    playerIds.forEach((id) => {
      const invite = mockGetPendingInviteForPlayer(id);
      if (invite) map.set(id, invite);
    });
    return map;
  }
  return fetchPendingInvitesByPlayerIds(playerIds, playerNames);
}

export async function getPendingInvites(): Promise<ManagerInvite[]> {
  if (useMockData()) {
    return mockPendingInvites.filter((invite) => invite.status === "pending");
  }
  return fetchPendingInvites();
}
