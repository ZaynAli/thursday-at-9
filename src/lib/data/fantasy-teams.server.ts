import { FANTASY_BUDGET, SQUAD_SIZE } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchCurrentGameweek } from "@/lib/data/gameweeks.server";
import { fetchProfileById } from "@/lib/data/profiles.server";
import { fetchPlayersByIds } from "@/lib/data/players.server";
import {
  calculateSquadCost,
  isFantasyTeamValid,
} from "@/lib/fantasy/squad";
import {
  canViewOtherFantasyTeams,
  isFantasySelectionEditable,
} from "@/lib/fantasy/gameweek-access";
import type { FantasySelection, FantasyTeam, Gameweek, Player } from "@/types";

interface FantasyTeamRow {
  id: string;
  gameweek_id: string;
  manager_id: string;
  submitted_at: string | null;
}

interface FantasySelectionRow {
  player_id: string;
  is_captain: boolean;
}

export interface ManagerFantasyTeamView {
  managerId: string;
  managerName: string;
  selections: FantasySelection[];
  submittedAt?: string;
}

function throwFantasyError(action: string, message: string): never {
  if (message.includes("permission denied")) {
    throw new Error(
      `${action}: ${message}. Run supabase/grants-service-role.sql in the Supabase SQL Editor.`
    );
  }
  throw new Error(`${action}: ${message}`);
}

function mapSelections(rows: FantasySelectionRow[]): FantasySelection[] {
  return rows.map((row) => ({
    playerId: row.player_id,
    isCaptain: row.is_captain,
  }));
}

async function loadGameweekOrThrow(gameweekId: string): Promise<Gameweek> {
  const current = await fetchCurrentGameweek();
  if (!current || current.id !== gameweekId) {
    throw new Error("Gameweek not found.");
  }
  return current;
}

function validateDraftSelections(
  selections: FantasySelection[],
  poolPlayers: Player[]
): void {
  if (selections.length > SQUAD_SIZE) {
    throw new Error(`Select at most ${SQUAD_SIZE} players.`);
  }

  const poolIds = new Set(poolPlayers.map((player) => player.id));
  const uniqueIds = new Set<string>();

  for (const selection of selections) {
    if (uniqueIds.has(selection.playerId)) {
      throw new Error("Duplicate player in squad.");
    }
    uniqueIds.add(selection.playerId);
    if (!poolIds.has(selection.playerId)) {
      throw new Error("One or more players are not in this gameweek pool.");
    }
  }

  const captains = selections.filter((selection) => selection.isCaptain);
  if (captains.length > 1) {
    throw new Error("Select at most one captain.");
  }

  const selectedPlayers = selections
    .map((selection) => poolPlayers.find((player) => player.id === selection.playerId))
    .filter(Boolean) as Player[];

  if (selectedPlayers.length > 0 && calculateSquadCost(selectedPlayers) > FANTASY_BUDGET) {
    throw new Error("Squad exceeds the budget.");
  }
}

export async function fetchFantasyTeamForManager(
  gameweekId: string,
  managerId: string
): Promise<FantasyTeam | null> {
  const supabase = createAdminClient();

  const { data: teamRow, error } = await supabase
    .from("fantasy_teams")
    .select("id, gameweek_id, manager_id, submitted_at")
    .eq("gameweek_id", gameweekId)
    .eq("manager_id", managerId)
    .maybeSingle();

  if (error) {
    throwFantasyError("Failed to load fantasy team", error.message);
  }
  if (!teamRow) return null;

  const row = teamRow as FantasyTeamRow;
  const { data: selectionRows, error: selectionError } = await supabase
    .from("fantasy_selections")
    .select("player_id, is_captain")
    .eq("fantasy_team_id", row.id);

  if (selectionError) {
    throwFantasyError("Failed to load fantasy selections", selectionError.message);
  }

  return {
    managerId: row.manager_id,
    gameweekId: row.gameweek_id,
    submittedAt: row.submitted_at ?? undefined,
    selections: mapSelections((selectionRows ?? []) as FantasySelectionRow[]),
  };
}

export async function fetchVisibleFantasyTeams(
  gameweekId: string
): Promise<ManagerFantasyTeamView[]> {
  const gameweek = await loadGameweekOrThrow(gameweekId);
  if (!canViewOtherFantasyTeams(gameweek)) return [];

  const supabase = createAdminClient();
  const { data: teamRows, error } = await supabase
    .from("fantasy_teams")
    .select("id, manager_id, submitted_at")
    .eq("gameweek_id", gameweekId)
    .not("submitted_at", "is", null)
    .order("submitted_at", { ascending: true });

  if (error) {
    throwFantasyError("Failed to load fantasy teams", error.message);
  }

  const rows = (teamRows ?? []) as Array<{
    id: string;
    manager_id: string;
    submitted_at: string | null;
  }>;

  if (rows.length === 0) return [];

  const teamIds = rows.map((row) => row.id);
  const { data: selectionRows, error: selectionError } = await supabase
    .from("fantasy_selections")
    .select("fantasy_team_id, player_id, is_captain")
    .in("fantasy_team_id", teamIds);

  if (selectionError) {
    throwFantasyError("Failed to load fantasy selections", selectionError.message);
  }

  const selectionsByTeam = new Map<string, FantasySelection[]>();
  for (const row of (selectionRows ?? []) as Array<
    FantasySelectionRow & { fantasy_team_id: string }
  >) {
    const list = selectionsByTeam.get(row.fantasy_team_id) ?? [];
    list.push({ playerId: row.player_id, isCaptain: row.is_captain });
    selectionsByTeam.set(row.fantasy_team_id, list);
  }

  const views: ManagerFantasyTeamView[] = [];
  for (const row of rows) {
    const profile = await fetchProfileById(row.manager_id);
    views.push({
      managerId: row.manager_id,
      managerName: profile?.name ?? "Manager",
      submittedAt: row.submitted_at ?? undefined,
      selections: selectionsByTeam.get(row.id) ?? [],
    });
  }

  return views;
}

export async function saveFantasyTeam(
  gameweekId: string,
  managerId: string,
  selections: FantasySelection[],
  confirm: boolean
): Promise<FantasyTeam> {
  const gameweek = await loadGameweekOrThrow(gameweekId);

  if (!isFantasySelectionEditable(gameweek)) {
    throw new Error("Fantasy selection is locked for this gameweek.");
  }

  const poolPlayers = await fetchPlayersByIds(gameweek.availablePlayerIds);
  validateDraftSelections(selections, poolPlayers);

  if (confirm) {
    const validation = isFantasyTeamValid(selections, poolPlayers);
    if (!validation.isValid) {
      throw new Error(validation.errors[0] ?? "Invalid fantasy team.");
    }
  }

  const supabase = createAdminClient();

  const { data: existing, error: existingError } = await supabase
    .from("fantasy_teams")
    .select("id, submitted_at")
    .eq("gameweek_id", gameweekId)
    .eq("manager_id", managerId)
    .maybeSingle();

  if (existingError) {
    throwFantasyError("Failed to load fantasy team", existingError.message);
  }

  const existingRow = existing as { id: string; submitted_at: string | null } | null;

  if (selections.length === 0 && !confirm) {
    if (existingRow && !existingRow.submitted_at) {
      await supabase.from("fantasy_selections").delete().eq("fantasy_team_id", existingRow.id);
      await supabase.from("fantasy_teams").delete().eq("id", existingRow.id);
    }
    return {
      managerId,
      gameweekId,
      selections: [],
      submittedAt: existingRow?.submitted_at ?? undefined,
    };
  }

  const submittedAt = confirm ? new Date().toISOString() : null;

  let teamId = existingRow?.id;

  if (teamId) {
    const updatePayload: { updated_at: string; submitted_at?: string } = {
      updated_at: new Date().toISOString(),
    };
    if (confirm) {
      updatePayload.submitted_at = submittedAt!;
    }

    const { error: updateError } = await supabase
      .from("fantasy_teams")
      .update(updatePayload)
      .eq("id", teamId);

    if (updateError) {
      throwFantasyError("Failed to update fantasy team", updateError.message);
    }
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from("fantasy_teams")
      .insert({
        gameweek_id: gameweekId,
        manager_id: managerId,
        submitted_at: submittedAt,
      })
      .select("id")
      .single();

    if (insertError) {
      throwFantasyError("Failed to create fantasy team", insertError.message);
    }

    teamId = (inserted as { id: string }).id;
  }

  const { error: deleteError } = await supabase
    .from("fantasy_selections")
    .delete()
    .eq("fantasy_team_id", teamId);

  if (deleteError) {
    throwFantasyError("Failed to update fantasy selections", deleteError.message);
  }

  if (selections.length > 0) {
    const rows = selections.map((selection) => ({
      fantasy_team_id: teamId!,
      player_id: selection.playerId,
      is_captain: selection.isCaptain,
    }));

    const { error: insertSelectionsError } = await supabase
      .from("fantasy_selections")
      .insert(rows);

    if (insertSelectionsError) {
      throwFantasyError("Failed to save fantasy selections", insertSelectionsError.message);
    }
  }

  const saved = await fetchFantasyTeamForManager(gameweekId, managerId);
  if (!saved) {
    throw new Error("Failed to load saved fantasy team.");
  }

  return saved;
}
