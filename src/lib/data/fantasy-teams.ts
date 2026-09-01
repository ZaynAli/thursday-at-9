import { useMockData } from "@/lib/data/config";
import {
  fetchFantasyTeamForManager,
  fetchVisibleFantasyTeams,
  saveFantasyTeam,
  type ManagerFantasyTeamView,
} from "@/lib/data/fantasy-teams.server";
import type { FantasySelection, FantasyTeam } from "@/types";

export type { ManagerFantasyTeamView };

export async function getFantasyTeamForManager(
  gameweekId: string,
  managerId: string
): Promise<FantasyTeam | null> {
  if (useMockData() || gameweekId === "draft") return null;
  return fetchFantasyTeamForManager(gameweekId, managerId);
}

export async function getVisibleFantasyTeams(
  gameweekId: string
): Promise<ManagerFantasyTeamView[]> {
  if (useMockData() || gameweekId === "draft") return [];
  return fetchVisibleFantasyTeams(gameweekId);
}

export async function persistFantasyTeam(
  gameweekId: string,
  managerId: string,
  selections: FantasySelection[],
  confirm: boolean
): Promise<FantasyTeam> {
  if (useMockData()) {
    throw new Error("Connect Supabase to save fantasy teams.");
  }
  return saveFantasyTeam(gameweekId, managerId, selections, confirm);
}
