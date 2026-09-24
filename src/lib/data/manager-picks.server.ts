import { createAdminClient } from "@/lib/supabase/admin";
import { preferPlayerName } from "@/lib/data/display-names";
import { fetchFantasyManagers } from "@/lib/data/profiles.server";
import { fetchPlayersByIds } from "@/lib/data/players.server";
import type { GameweekStatus } from "@/types";

export type ManagerPickStatus = "not_saved" | "draft" | "confirmed";

export interface ManagerPickRow {
  managerId: string;
  managerName: string;
  status: ManagerPickStatus;
  selectionCount: number;
  submittedAt?: string;
  updatedAt?: string;
}

export interface ManagerPicksSnapshot {
  gameweekId: string;
  gameweekNumber: number;
  gameweekStatus: GameweekStatus;
  managers: ManagerPickRow[];
}

interface TeamRow {
  id: string;
  manager_id: string;
  submitted_at: string | null;
  updated_at: string;
}

export async function fetchManagerPicksSnapshot(
  gameweekId: string,
  gameweekNumber: number,
  gameweekStatus: GameweekStatus
): Promise<ManagerPicksSnapshot> {
  const managers = await fetchFantasyManagers();
  const supabase = createAdminClient();

  const { data: teamRows, error: teamError } = await supabase
    .from("fantasy_teams")
    .select("id, manager_id, submitted_at, updated_at")
    .eq("gameweek_id", gameweekId);

  if (teamError) {
    throw new Error(`Failed to load fantasy teams: ${teamError.message}`);
  }

  const teams = (teamRows ?? []) as TeamRow[];
  const teamByManager = new Map(teams.map((row) => [row.manager_id, row]));
  const teamIds = teams.map((row) => row.id);

  const selectionCountByTeam = new Map<string, number>();
  if (teamIds.length > 0) {
    const { data: selectionRows, error: selectionError } = await supabase
      .from("fantasy_selections")
      .select("fantasy_team_id")
      .in("fantasy_team_id", teamIds);

    if (selectionError) {
      throw new Error(
        `Failed to load fantasy selections: ${selectionError.message}`
      );
    }

    for (const row of selectionRows ?? []) {
      const teamId = row.fantasy_team_id as string;
      selectionCountByTeam.set(
        teamId,
        (selectionCountByTeam.get(teamId) ?? 0) + 1
      );
    }
  }

  const playerIds = managers
    .map((manager) => manager.playerId)
    .filter((id): id is string => Boolean(id));
  const players =
    playerIds.length > 0
      ? await fetchPlayersByIds(playerIds, { withSeasonStats: false })
      : [];
  const playerNameById = new Map(players.map((player) => [player.id, player.name]));

  const rows: ManagerPickRow[] = managers.map((manager) => {
    const team = teamByManager.get(manager.id);
    const selectionCount = team
      ? (selectionCountByTeam.get(team.id) ?? 0)
      : 0;

    let status: ManagerPickStatus = "not_saved";
    if (team?.submitted_at) {
      status = "confirmed";
    } else if (team && selectionCount > 0) {
      status = "draft";
    }

    return {
      managerId: manager.id,
      managerName: preferPlayerName(
        manager.name,
        manager.playerId ? playerNameById.get(manager.playerId) : null
      ),
      status,
      selectionCount,
      submittedAt: team?.submitted_at ?? undefined,
      updatedAt: team?.updated_at,
    };
  });

  rows.sort((a, b) => a.managerName.localeCompare(b.managerName));

  return {
    gameweekId,
    gameweekNumber,
    gameweekStatus,
    managers: rows,
  };
}
