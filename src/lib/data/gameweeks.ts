import { useMockData } from "@/lib/data/config";
import {
  CURRENT_GAMEWEEK_ID,
  getCurrentGameweek as mockGetCurrentGameweek,
  mockLatestRecap,
} from "@/data/mock/gameweeks";
import {
  fetchCurrentGameweek,
  fetchGameweekNeedingResults,
  fetchNextGameweekNumber,
} from "@/lib/data/gameweeks.server";
import { getLatestRecap as fetchLatestRecapFromDb } from "@/lib/data/results";
import { GAME_TIME } from "@/lib/constants";
import { getNextFantasyDeadline, getNextGameDate } from "@/lib/gameweek-timing";
import type { Gameweek, GameweekRecap } from "@/types";

async function createEmptyDraftGameweek(): Promise<Gameweek> {
  const kickoff = getNextGameDate();
  const deadline = getNextFantasyDeadline();
  const number = useMockData() ? 1 : await fetchNextGameweekNumber();
  return {
    id: "draft",
    number,
    date: kickoff.toISOString(),
    gameTime: GAME_TIME.label,
    fantasyDeadline: deadline.toISOString(),
    status: "draft",
    availablePlayerIds: [],
    format: "7v7",
    teamWhiteName: "White",
    teamColorName: "Colours",
  };
}

export async function getCurrentGameweek(): Promise<Gameweek> {
  if (useMockData()) return mockGetCurrentGameweek();

  const gameweek = await fetchCurrentGameweek();
  if (gameweek) return gameweek;

  // No gameweek in DB — return empty draft (don't use mock; mock player ids are slugs, not UUIDs)
  return createEmptyDraftGameweek();
}

/**
 * Admin weekly-session target: keep editing the active GW, but after publish
 * (or when none exists) return a fresh draft with the next GW number.
 */
export async function getAdminSetupGameweek(): Promise<Gameweek> {
  if (useMockData()) return mockGetCurrentGameweek();

  const gameweek = await fetchCurrentGameweek();
  if (!gameweek || gameweek.status === "published") {
    return createEmptyDraftGameweek();
  }

  return gameweek;
}

/** Latest locked / in-progress gameweek still awaiting results entry. */
export async function getGameweekNeedingResults(): Promise<Gameweek | null> {
  if (useMockData()) return null;
  return fetchGameweekNeedingResults();
}

export async function getCurrentGameweekId(): Promise<string> {
  return (await getCurrentGameweek()).id;
}

export async function getLatestRecap(
  userId?: string | null
): Promise<GameweekRecap | null> {
  if (useMockData()) return mockLatestRecap;
  return fetchLatestRecapFromDb(userId);
}

/** @deprecated Use getCurrentGameweekId() — mock constant only */
export { CURRENT_GAMEWEEK_ID };
