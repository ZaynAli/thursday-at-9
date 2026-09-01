import { useMockData } from "@/lib/data/config";
import {
  getAvailablePlayers as mockGetAvailablePlayers,
  getPlayerById as mockGetPlayerById,
  getRosterPlayers as mockGetRosterPlayers,
} from "@/data/mock/players";
import {
  fetchAdminRosterPlayers,
  fetchPlayerById,
  fetchPlayerByName,
  fetchPlayersByIds,
  fetchRosterPlayers,
} from "@/lib/data/players.server";
import { filterUuidIds, isUuid } from "@/lib/data/utils";
import type { Player } from "@/types";

export async function getRosterPlayers(): Promise<Player[]> {
  if (useMockData()) return mockGetRosterPlayers();
  return fetchRosterPlayers();
}

export async function getAdminRosterPlayers(): Promise<Player[]> {
  if (useMockData()) return mockGetRosterPlayers();
  return fetchAdminRosterPlayers();
}

export async function getPlayerById(id: string): Promise<Player | null> {
  if (useMockData()) return mockGetPlayerById(id) ?? null;
  if (!isUuid(id)) return null;
  return fetchPlayerById(id);
}

export async function getPlayerByName(name: string): Promise<Player | null> {
  if (useMockData()) {
    return mockGetRosterPlayers().find((p) => p.name === name) ?? null;
  }
  return fetchPlayerByName(name);
}

export async function getAvailablePlayers(ids: string[]): Promise<Player[]> {
  if (useMockData()) return mockGetAvailablePlayers(ids);
  const uuidIds = filterUuidIds(ids);
  if (uuidIds.length === 0) return [];
  return fetchPlayersByIds(uuidIds);
}

export async function getPlayersWithoutProfile(): Promise<Player[]> {
  const roster = await getRosterPlayers();
  return roster.filter((player) => !player.profileId);
}
