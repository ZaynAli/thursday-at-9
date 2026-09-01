import { useMockData } from "@/lib/data/config";
import {
  fetchGameweekResultsSnapshot,
  fetchLatestRecapForUser,
  publishGameweek,
  saveGameweekResults,
  type GameweekResultsInput,
  type GameweekResultsSnapshot,
} from "@/lib/data/results.server";

export type { GameweekResultsInput, GameweekResultsSnapshot };

export async function getGameweekResultsSnapshot(): Promise<GameweekResultsSnapshot | null> {
  if (useMockData()) return null;
  return fetchGameweekResultsSnapshot();
}

export async function persistGameweekResults(input: GameweekResultsInput) {
  if (useMockData()) {
    throw new Error("Connect Supabase to save results.");
  }
  return saveGameweekResults(input);
}

export async function publishGameweekResults(gameweekId: string) {
  if (useMockData()) {
    throw new Error("Connect Supabase to publish gameweeks.");
  }
  return publishGameweek(gameweekId);
}

export async function getLatestRecap(userId?: string | null) {
  if (useMockData()) return null;
  return fetchLatestRecapForUser(userId);
}
