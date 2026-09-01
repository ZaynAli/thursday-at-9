import { useMockData } from "@/lib/data/config";
import {
  getStandingsWithCurrentUser as mockGetStandingsWithCurrentUser,
  mockPlayerSeasonStats,
} from "@/data/mock/standings";
import {
  fetchPlayerSeasonStats,
  fetchStandings,
} from "@/lib/data/standings.server";
import type { LeagueStanding, PlayerSeasonStats } from "@/types";

export async function getStandingsWithCurrentUser(
  currentUserId?: string | null
): Promise<LeagueStanding[]> {
  if (useMockData()) return mockGetStandingsWithCurrentUser();
  return fetchStandings(currentUserId);
}

export async function getPlayerSeasonStats(): Promise<PlayerSeasonStats[]> {
  if (useMockData()) return mockPlayerSeasonStats;
  return fetchPlayerSeasonStats();
}
