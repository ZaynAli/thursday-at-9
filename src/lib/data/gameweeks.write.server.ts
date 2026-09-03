import { DEFAULT_FANTASY_DEADLINE, GAME_TIME } from "@/lib/constants";
import { easternDateTimeToIso } from "@/lib/gameweek-timing";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapGameweekRow } from "@/lib/data/mappers/gameweek";
import { fetchCurrentGameweek } from "@/lib/data/gameweeks.server";
import type { GameweekRow } from "@/lib/data/db-types";
import {
  buildDefaultFormation,
  formationToSlotMap,
  type TeamFormation,
} from "@/lib/formations";
import {
  SESSION_TEAM_TO_DB_SIDE,
  isTeamSetupComplete,
  type GameFormat,
  type TeamAssignments,
} from "@/lib/session-formats";
import type { Gameweek, GameweekStatus } from "@/types";

export interface GameweekSessionInput {
  gameweekId: string | null;
  number: number;
  /** YYYY-MM-DD */
  scheduledDate: string;
  format: GameFormat;
  selectedPlayerIds: string[];
  teamWhiteName: string;
  teamColorName: string;
  assignments: TeamAssignments;
}

function throwGameweekError(action: string, message: string): never {
  if (message.includes("permission denied")) {
    throw new Error(
      `${action}: ${message}. Run supabase/grants-service-role.sql in the Supabase SQL Editor.`
    );
  }
  throw new Error(`${action}: ${message}`);
}

function parseDateParts(dateStr: string): { year: number; month: number; day: number } {
  const [year, month, day] = dateStr.split("-").map(Number);
  if (!year || !month || !day) {
    throw new Error("Invalid game date.");
  }
  return { year, month, day };
}

export function buildScheduledAt(dateStr: string): string {
  const { year, month, day } = parseDateParts(dateStr);
  return easternDateTimeToIso(year, month, day, GAME_TIME.hour, GAME_TIME.minute);
}

export function buildFantasyDeadlineAt(dateStr: string): string {
  const { year, month, day } = parseDateParts(dateStr);
  return easternDateTimeToIso(
    year,
    month,
    day,
    DEFAULT_FANTASY_DEADLINE.hour,
    DEFAULT_FANTASY_DEADLINE.minute
  );
}

async function getOrCreateCurrentSeasonId(): Promise<string> {
  const supabase = createAdminClient();

  const { data: current, error: currentError } = await supabase
    .from("seasons")
    .select("id")
    .eq("is_current", true)
    .maybeSingle();

  if (currentError) {
    throwGameweekError("Failed to load season", currentError.message);
  }
  if (current?.id) return current.id;

  const year = new Date().getFullYear();
  const { data, error } = await supabase
    .from("seasons")
    .insert({
      name: `Thursday@9 ${year}`,
      start_date: `${year}-01-01`,
      is_current: true,
    })
    .select("id")
    .single();

  if (error) throwGameweekError("Failed to create season", error.message);
  return data.id;
}

async function getNextGameweekNumber(seasonId: string): Promise<number> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("gameweeks")
    .select("number")
    .eq("season_id", seasonId)
    .order("number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throwGameweekError("Failed to load gameweek number", error.message);
  return (data?.number ?? 0) + 1;
}

async function replaceGameweekPlayers(
  gameweekId: string,
  playerIds: string[]
): Promise<void> {
  const supabase = createAdminClient();

  const { error: deleteError } = await supabase
    .from("gameweek_players")
    .delete()
    .eq("gameweek_id", gameweekId);

  if (deleteError) {
    throwGameweekError("Failed to update session pool", deleteError.message);
  }

  if (playerIds.length === 0) return;

  const { error: insertError } = await supabase.from("gameweek_players").insert(
    playerIds.map((player_id) => ({
      gameweek_id: gameweekId,
      player_id,
    }))
  );

  if (insertError) {
    throwGameweekError("Failed to update session pool", insertError.message);
  }
}

async function upsertMatchAndAssignments(
  gameweekId: string,
  teamWhiteName: string,
  teamColorName: string,
  selectedPlayerIds: string[],
  assignments: TeamAssignments,
  format: GameFormat
): Promise<void> {
  const supabase = createAdminClient();

  const { data: existingMatch, error: matchLookupError } = await supabase
    .from("matches")
    .select("id")
    .eq("gameweek_id", gameweekId)
    .maybeSingle();

  if (matchLookupError) {
    throwGameweekError("Failed to load match", matchLookupError.message);
  }

  let matchId = existingMatch?.id as string | undefined;

  if (matchId) {
    const { error: updateError } = await supabase
      .from("matches")
      .update({
        team_a_name: teamWhiteName.trim() || "White",
        team_b_name: teamColorName.trim() || "Colours",
      })
      .eq("id", matchId);

    if (updateError) {
      throwGameweekError("Failed to update match", updateError.message);
    }
  } else {
    const { data: created, error: createError } = await supabase
      .from("matches")
      .insert({
        gameweek_id: gameweekId,
        team_a_name: teamWhiteName.trim() || "White",
        team_b_name: teamColorName.trim() || "Colours",
      })
      .select("id")
      .single();

    if (createError) throwGameweekError("Failed to create match", createError.message);
    matchId = created.id;
  }

  const { error: deleteAssignmentsError } = await supabase
    .from("match_players")
    .delete()
    .eq("match_id", matchId);

  if (deleteAssignmentsError) {
    throwGameweekError("Failed to update team assignments", deleteAssignmentsError.message);
  }

  const defaultFormation = buildDefaultFormation(
    Object.fromEntries(
      selectedPlayerIds
        .map((playerId) => {
          const team = assignments[playerId];
          if (team !== "white" && team !== "color") return null;
          return [playerId, team] as const;
        })
        .filter((entry): entry is [string, "white" | "color"] => Boolean(entry))
    ),
    format
  );

  const slotMap = formationToSlotMap(defaultFormation);

  const rows: {
    match_id: string;
    player_id: string;
    team_side: "a" | "b";
    position_index: number | null;
  }[] = [];

  for (const playerId of selectedPlayerIds) {
    const team = assignments[playerId];
    if (team !== "white" && team !== "color") continue;
    const slot = slotMap[playerId]?.slot;
    rows.push({
      match_id: matchId!,
      player_id: playerId,
      team_side: SESSION_TEAM_TO_DB_SIDE[team],
      position_index: slot ?? null,
    });
  }

  if (rows.length === 0) return;

  const { error: insertAssignmentsError } = await supabase
    .from("match_players")
    .insert(rows);

  if (insertAssignmentsError) {
    throwGameweekError("Failed to update team assignments", insertAssignmentsError.message);
  }
}

async function loadGameweekById(gameweekId: string): Promise<Gameweek> {
  const gameweek = await fetchCurrentGameweek();
  if (gameweek?.id === gameweekId) return gameweek;

  const supabase = createAdminClient();
  const { data: row, error } = await supabase
    .from("gameweeks")
    .select("*")
    .eq("id", gameweekId)
    .maybeSingle();

  if (error || !row) {
    throw new Error("Gameweek not found after save.");
  }

  const [{ data: poolRows }, { data: matchRow }] = await Promise.all([
    supabase.from("gameweek_players").select("player_id").eq("gameweek_id", gameweekId),
    supabase.from("matches").select("*").eq("gameweek_id", gameweekId).maybeSingle(),
  ]);

  let matchPlayers: { player_id: string; team_side: "a" | "b"; position_index: number | null }[] = [];
  if (matchRow) {
    const { data: assignmentRows } = await supabase
      .from("match_players")
      .select("player_id, team_side, position_index")
      .eq("match_id", matchRow.id);
    matchPlayers = (assignmentRows ?? []) as {
      player_id: string;
      team_side: "a" | "b";
      position_index: number | null;
    }[];
  }

  return mapGameweekRow(
    row as GameweekRow,
    (poolRows ?? []).map((entry) => entry.player_id),
    matchRow,
    matchPlayers
  );
}

export async function saveGameweekSession(
  input: GameweekSessionInput
): Promise<Gameweek> {
  const supabase = createAdminClient();
  const seasonId = await getOrCreateCurrentSeasonId();
  const scheduledAt = buildScheduledAt(input.scheduledDate);
  const fantasyDeadline = buildFantasyDeadlineAt(input.scheduledDate);

  let gameweekId = input.gameweekId;
  let gameweekNumber = input.number;

  const isNew = !gameweekId || gameweekId === "draft";

  if (isNew) {
    gameweekNumber = await getNextGameweekNumber(seasonId);
    const { data, error } = await supabase
      .from("gameweeks")
      .insert({
        season_id: seasonId,
        number: gameweekNumber,
        scheduled_at: scheduledAt,
        fantasy_deadline: fantasyDeadline,
        format: input.format,
        status: "draft",
      })
      .select("id")
      .single();

    if (error) throwGameweekError("Failed to create gameweek", error.message);
    gameweekId = data.id;
  } else {
    const { error } = await supabase
      .from("gameweeks")
      .update({
        scheduled_at: scheduledAt,
        fantasy_deadline: fantasyDeadline,
        format: input.format,
      })
      .eq("id", gameweekId);

    if (error) throwGameweekError("Failed to update gameweek", error.message);
  }

  await replaceGameweekPlayers(gameweekId!, input.selectedPlayerIds);
  await upsertMatchAndAssignments(
    gameweekId!,
    input.teamWhiteName,
    input.teamColorName,
    input.selectedPlayerIds,
    input.assignments,
    input.format
  );

  return loadGameweekById(gameweekId!);
}

export async function openGameweekSelection(
  input: GameweekSessionInput,
  adminId: string,
  recipientCount: number
): Promise<Gameweek> {
  const setup = isTeamSetupComplete(
    input.selectedPlayerIds,
    input.assignments,
    input.format
  );
  if (!setup.complete) {
    throw new Error(setup.issues[0] ?? "Complete session setup before opening selection.");
  }

  const gameweek = await saveGameweekSession(input);
  const supabase = createAdminClient();

  const { error: statusError } = await supabase
    .from("gameweeks")
    .update({ status: "selection_open" satisfies GameweekStatus })
    .eq("id", gameweek.id);

  if (statusError) {
    throwGameweekError("Failed to open selection", statusError.message);
  }

  const { error: notifyError } = await supabase.from("gameweek_notifications").insert({
    gameweek_id: gameweek.id,
    sent_by: adminId,
    recipient_count: recipientCount,
    channel: "in_app",
  });

  if (notifyError) {
    throwGameweekError("Failed to record notification", notifyError.message);
  }

  return { ...gameweek, status: "selection_open" };
}

export async function lockGameweekSelection(gameweekId: string): Promise<Gameweek> {
  if (!gameweekId || gameweekId === "draft") {
    throw new Error("Save the session before locking selection.");
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("gameweeks")
    .update({ status: "selection_locked" satisfies GameweekStatus })
    .eq("id", gameweekId);

  if (error) throwGameweekError("Failed to lock selection", error.message);

  const gameweek = await loadGameweekById(gameweekId);
  return { ...gameweek, status: "selection_locked" };
}

export async function fetchLatestGameweekNotification(
  gameweekId: string
): Promise<{ sentAt: string; recipientCount: number } | null> {
  if (!gameweekId || gameweekId === "draft") return null;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("gameweek_notifications")
    .select("sent_at, recipient_count")
    .eq("gameweek_id", gameweekId)
    .order("sent_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return {
    sentAt: data.sent_at,
    recipientCount: data.recipient_count,
  };
}

export async function updateMatchFormation(
  gameweekId: string,
  formation: TeamFormation
): Promise<Gameweek> {
  if (!gameweekId || gameweekId === "draft") {
    throw new Error("Save the session before editing formation.");
  }

  const supabase = createAdminClient();
  const { data: matchRow, error: matchError } = await supabase
    .from("matches")
    .select("id")
    .eq("gameweek_id", gameweekId)
    .maybeSingle();

  if (matchError) throwGameweekError("Failed to load match", matchError.message);
  if (!matchRow?.id) throw new Error("No match found for this gameweek.");

  const matchId = matchRow.id;

  // Clear slots first so same-team swaps don't hit the unique (match, side, slot) index.
  const { error: clearError } = await supabase
    .from("match_players")
    .update({ position_index: null })
    .eq("match_id", matchId);

  if (clearError) {
    throwGameweekError("Failed to update formation", clearError.message);
  }

  const slotMap = formationToSlotMap(formation);

  for (const [playerId, { slot }] of Object.entries(slotMap)) {
    const { error } = await supabase
      .from("match_players")
      .update({ position_index: slot })
      .eq("match_id", matchId)
      .eq("player_id", playerId);

    if (error) {
      throwGameweekError("Failed to update formation", error.message);
    }
  }

  return loadGameweekById(gameweekId);
}
