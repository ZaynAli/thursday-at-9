import { useMockData } from "@/lib/data/config";
import {
  fetchManagerPicksSnapshot,
  type ManagerPicksSnapshot,
  type ManagerPickRow,
  type ManagerPickStatus,
} from "@/lib/data/manager-picks.server";
import type { GameweekStatus } from "@/types";

export type { ManagerPicksSnapshot, ManagerPickRow, ManagerPickStatus };

export async function getManagerPicksSnapshot(
  gameweekId: string,
  gameweekNumber: number,
  gameweekStatus: GameweekStatus
): Promise<ManagerPicksSnapshot | null> {
  if (useMockData() || gameweekId === "draft") return null;
  return fetchManagerPicksSnapshot(gameweekId, gameweekNumber, gameweekStatus);
}
