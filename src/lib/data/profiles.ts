import { useMockData } from "@/lib/data/config";
import {
  CURRENT_USER_ID,
  getCurrentUser as mockGetCurrentUser,
  getFantasyManagers as mockGetFantasyManagers,
  getProfileById as mockGetProfileById,
  getProfileByPlayerId as mockGetProfileByPlayerId,
} from "@/data/mock/profiles";
import {
  fetchAuthProfile,
  fetchFantasyManagers,
  fetchProfileById,
  fetchProfileByPlayerId,
  fetchProfilesByPlayerIds,
} from "@/lib/data/profiles.server";
import type { Profile } from "@/types";

export async function getCurrentUser(): Promise<Profile | null> {
  if (useMockData()) return mockGetCurrentUser();

  return fetchAuthProfile();
}

export async function getCurrentUserId(): Promise<string | null> {
  if (useMockData()) return CURRENT_USER_ID;
  const user = await getCurrentUser();
  return user?.id ?? null;
}

export async function getProfileById(id: string): Promise<Profile | null> {
  if (useMockData()) return mockGetProfileById(id) ?? null;
  return fetchProfileById(id);
}

export async function getProfileByPlayerId(
  playerId: string
): Promise<Profile | null> {
  if (useMockData()) return mockGetProfileByPlayerId(playerId) ?? null;
  return fetchProfileByPlayerId(playerId);
}

export async function getFantasyManagers(): Promise<Profile[]> {
  if (useMockData()) return mockGetFantasyManagers();
  return fetchFantasyManagers();
}

export async function getProfilesByPlayerIds(
  playerIds: string[]
): Promise<Map<string, Profile>> {
  if (useMockData()) {
    const map = new Map<string, Profile>();
    playerIds.forEach((id) => {
      const profile = mockGetProfileByPlayerId(id);
      if (profile) map.set(id, profile);
    });
    return map;
  }
  return fetchProfilesByPlayerIds(playerIds);
}
