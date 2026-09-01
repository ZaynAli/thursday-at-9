import { createAdminClient } from "@/lib/supabase/admin";
import { fetchCurrentGameweek } from "@/lib/data/gameweeks.server";
import { fetchPlayersByIds } from "@/lib/data/players.server";
import {
  calculatePlayerFantasyPoints,
  calculateTeamGameweekPoints,
} from "@/lib/fantasy/scoring";
import type { Gameweek, GameweekRecap, GameweekStatus } from "@/types";

export interface PlayerResultInput {
  playerId: string;
  teamSide: "a" | "b";
  goals: number;
  assists: number;
  defensiveStops: number;
}

export interface GameweekResultsInput {
  gameweekId: string;
  teamAScore: number;
  teamBScore: number;
  playerStats: PlayerResultInput[];
}

export interface GameweekResultsSnapshot {
  gameweekId: string;
  gameweekNumber: number;
  gameweekStatus: GameweekStatus;
  teamAName: string;
  teamBName: string;
  teamAScore: number | null;
  teamBScore: number | null;
  playerStats: PlayerResultInput[];
  isPublished: boolean;
}

interface PlayerGameweekStatsRow {
  player_id: string;
  team_side: "a" | "b" | null;
  goals: number;
  assists: number;
  defensive_stops: number;
}

interface FantasyTeamRow {
  id: string;
  manager_id: string;
  submitted_at: string | null;
}

interface FantasySelectionRow {
  player_id: string;
  is_captain: boolean;
}

function throwResultsError(action: string, message: string): never {
  if (message.includes("permission denied")) {
    throw new Error(
      `${action}: ${message}. Run supabase/grants-service-role.sql in the Supabase SQL Editor.`
    );
  }
  throw new Error(`${action}: ${message}`);
}

function deriveMatchOutcome(
  teamSide: "a" | "b",
  teamAScore: number,
  teamBScore: number
): { won: boolean; drew: boolean } {
  if (teamAScore === teamBScore) {
    return { won: false, drew: true };
  }
  const teamAWon = teamAScore > teamBScore;
  const won = teamSide === "a" ? teamAWon : !teamAWon;
  return { won, drew: false };
}

async function getCurrentSeasonId(): Promise<string> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("seasons")
    .select("id")
    .eq("is_current", true)
    .maybeSingle();

  if (error) throwResultsError("Failed to load season", error.message);
  if (!data?.id) throw new Error("No current season found.");

  return data.id;
}

async function loadGameweekForResults(gameweekId: string) {
  const current = await fetchCurrentGameweek();
  if (current?.id === gameweekId) return current;
  throw new Error("Only the current gameweek can be updated from results.");
}

export async function fetchGameweekResultsSnapshot(): Promise<GameweekResultsSnapshot | null> {
  const gameweek = await fetchCurrentGameweek();
  if (!gameweek || gameweek.id === "draft") return null;

  const supabase = createAdminClient();
  const { data: matchRow, error: matchError } = await supabase
    .from("matches")
    .select("team_a_name, team_b_name, team_a_score, team_b_score")
    .eq("gameweek_id", gameweek.id)
    .maybeSingle();

  if (matchError) {
    throwResultsError("Failed to load match", matchError.message);
  }

  const { data: statRows, error: statsError } = await supabase
    .from("player_gameweek_stats")
    .select("player_id, team_side, goals, assists, defensive_stops")
    .eq("gameweek_id", gameweek.id);

  if (statsError) {
    throwResultsError("Failed to load player stats", statsError.message);
  }

  const statsByPlayer = new Map(
    ((statRows ?? []) as PlayerGameweekStatsRow[]).map((row) => [row.player_id, row])
  );

  const playerStats: PlayerResultInput[] = gameweek.availablePlayerIds.map((playerId) => {
    const saved = statsByPlayer.get(playerId);
    const assignment = gameweek.teamAssignments?.[playerId];
    const defaultSide =
      assignment === "white" ? "a" : assignment === "color" ? "b" : "a";

    return {
      playerId,
      teamSide: saved?.team_side ?? defaultSide,
      goals: saved?.goals ?? 0,
      assists: saved?.assists ?? 0,
      defensiveStops: saved?.defensive_stops ?? 0,
    };
  });

  return {
    gameweekId: gameweek.id,
    gameweekNumber: gameweek.number,
    gameweekStatus: gameweek.status,
    teamAName: matchRow?.team_a_name ?? gameweek.teamWhiteName ?? "White",
    teamBName: matchRow?.team_b_name ?? gameweek.teamColorName ?? "Colours",
    teamAScore: matchRow?.team_a_score ?? null,
    teamBScore: matchRow?.team_b_score ?? null,
    playerStats,
    isPublished: gameweek.status === "published",
  };
}

export async function saveGameweekResults(input: GameweekResultsInput): Promise<Gameweek> {
  const gameweek = await loadGameweekForResults(input.gameweekId);

  if (gameweek.status === "published") {
    throw new Error("This gameweek is already published.");
  }

  if (!["selection_locked", "in_progress", "results_pending"].includes(gameweek.status)) {
    throw new Error("Lock selection before entering results.");
  }

  const poolIds = new Set(gameweek.availablePlayerIds);
  for (const stat of input.playerStats) {
    if (!poolIds.has(stat.playerId)) {
      throw new Error("Player stats include someone outside this session.");
    }
  }

  const supabase = createAdminClient();

  const { data: matchRow, error: matchLookupError } = await supabase
    .from("matches")
    .select("id")
    .eq("gameweek_id", input.gameweekId)
    .maybeSingle();

  if (matchLookupError) {
    throwResultsError("Failed to load match", matchLookupError.message);
  }
  if (!matchRow?.id) {
    throw new Error("No match found for this gameweek — save the session first.");
  }

  const { error: matchUpdateError } = await supabase
    .from("matches")
    .update({
      team_a_score: input.teamAScore,
      team_b_score: input.teamBScore,
      updated_at: new Date().toISOString(),
    })
    .eq("id", matchRow.id);

  if (matchUpdateError) {
    throwResultsError("Failed to save match score", matchUpdateError.message);
  }

  const statRows = input.playerStats.map((stat) => {
    const outcome = deriveMatchOutcome(stat.teamSide, input.teamAScore, input.teamBScore);
    return {
      gameweek_id: input.gameweekId,
      player_id: stat.playerId,
      appeared: true,
      team_side: stat.teamSide,
      won: outcome.won,
      drew: outcome.drew,
      goals: stat.goals,
      assists: stat.assists,
      defensive_stops: stat.defensiveStops,
      updated_at: new Date().toISOString(),
    };
  });

  const { error: deleteStatsError } = await supabase
    .from("player_gameweek_stats")
    .delete()
    .eq("gameweek_id", input.gameweekId);

  if (deleteStatsError) {
    throwResultsError("Failed to reset player stats", deleteStatsError.message);
  }

  if (statRows.length > 0) {
    const { error: insertStatsError } = await supabase
      .from("player_gameweek_stats")
      .insert(statRows);

    if (insertStatsError) {
      throwResultsError("Failed to save player stats", insertStatsError.message);
    }
  }

  const { error: statusError } = await supabase
    .from("gameweeks")
    .update({ status: "results_pending" satisfies GameweekStatus })
    .eq("id", input.gameweekId);

  if (statusError) {
    throwResultsError("Failed to update gameweek status", statusError.message);
  }

  const updated = await fetchCurrentGameweek();
  if (!updated) throw new Error("Failed to reload gameweek.");
  return { ...updated, status: "results_pending" };
}

export async function publishGameweek(gameweekId: string): Promise<Gameweek> {
  const gameweek = await loadGameweekForResults(gameweekId);

  if (gameweek.status === "published") {
    throw new Error("This gameweek is already published.");
  }

  const supabase = createAdminClient();
  const seasonId = await getCurrentSeasonId();

  const { data: matchRow, error: matchError } = await supabase
    .from("matches")
    .select("team_a_score, team_b_score")
    .eq("gameweek_id", gameweekId)
    .maybeSingle();

  if (matchError) throwResultsError("Failed to load match", matchError.message);
  if (matchRow?.team_a_score == null || matchRow?.team_b_score == null) {
    throw new Error("Enter the final score before publishing.");
  }

  const teamAScore = matchRow.team_a_score;
  const teamBScore = matchRow.team_b_score;

  const { data: statRows, error: statsError } = await supabase
    .from("player_gameweek_stats")
    .select("*")
    .eq("gameweek_id", gameweekId);

  if (statsError) throwResultsError("Failed to load player stats", statsError.message);
  if (!statRows?.length) {
    throw new Error("Save player statistics before publishing.");
  }

  const playerPoints = new Map<string, number>();
  for (const row of statRows as Array<{
    player_id: string;
    appeared: boolean;
    won: boolean;
    drew: boolean;
    goals: number;
    assists: number;
    defensive_stops: number;
  }>) {
    const points = calculatePlayerFantasyPoints({
      appeared: row.appeared,
      won: row.won,
      drew: row.drew,
      goals: row.goals,
      assists: row.assists,
      defensiveStops: row.defensive_stops,
    });

    playerPoints.set(row.player_id, points);

    await supabase
      .from("player_gameweek_stats")
      .update({ fantasy_points: points })
      .eq("gameweek_id", gameweekId)
      .eq("player_id", row.player_id);
  }

  const { data: fantasyTeamRows, error: teamsError } = await supabase
    .from("fantasy_teams")
    .select("id, manager_id, submitted_at")
    .eq("gameweek_id", gameweekId);

  if (teamsError) throwResultsError("Failed to load fantasy teams", teamsError.message);

  const managerPoints = new Map<string, number>();

  for (const teamRow of (fantasyTeamRows ?? []) as FantasyTeamRow[]) {
    if (!teamRow.submitted_at) continue;

    const { data: selectionRows, error: selectionError } = await supabase
      .from("fantasy_selections")
      .select("player_id, is_captain")
      .eq("fantasy_team_id", teamRow.id);

    if (selectionError) {
      throwResultsError("Failed to load fantasy selections", selectionError.message);
    }

    const breakdown = ((selectionRows ?? []) as FantasySelectionRow[]).map((selection) => ({
      points: playerPoints.get(selection.player_id) ?? 0,
      isCaptain: selection.is_captain,
    }));

    const total = calculateTeamGameweekPoints(breakdown);
    managerPoints.set(teamRow.manager_id, total);

    await supabase
      .from("fantasy_teams")
      .update({ total_points: total, updated_at: new Date().toISOString() })
      .eq("id", teamRow.id);
  }

  const { data: previousPublished, error: previousError } = await supabase
    .from("gameweeks")
    .select("id, number")
    .eq("season_id", seasonId)
    .eq("status", "published")
    .lt("number", gameweek.number)
    .order("number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (previousError) {
    throwResultsError("Failed to load previous gameweek", previousError.message);
  }

  const previousRanks = new Map<string, number>();
  if (previousPublished?.id) {
    const { data: previousScores } = await supabase
      .from("fantasy_scores")
      .select("manager_id, rank")
      .eq("gameweek_id", previousPublished.id);

    for (const row of previousScores ?? []) {
      if (row.rank != null) {
        previousRanks.set(row.manager_id, row.rank);
      }
    }
  }

  const { data: managerProfiles, error: managersError } = await supabase
    .from("profiles")
    .select("id")
    .eq("is_fantasy_manager", true);

  if (managersError) {
    throwResultsError("Failed to load fantasy managers", managersError.message);
  }

  const managerIds = (managerProfiles ?? []).map((row) => row.id as string);

  const { data: publishedGameweeks } = await supabase
    .from("gameweeks")
    .select("id")
    .eq("season_id", seasonId)
    .eq("status", "published");

  const publishedGameweekIds = (publishedGameweeks ?? [])
    .map((row) => row.id as string)
    .filter((id) => id !== gameweekId);

  const seasonTotals = new Map<string, number>();

  for (const managerId of managerIds) {
    let seasonTotal = managerPoints.get(managerId) ?? 0;

    if (publishedGameweekIds.length > 0) {
      const { data: priorTeams } = await supabase
        .from("fantasy_teams")
        .select("total_points")
        .eq("manager_id", managerId)
        .in("gameweek_id", publishedGameweekIds);

      seasonTotal += (priorTeams ?? []).reduce(
        (sum, row) => sum + ((row.total_points as number | null) ?? 0),
        0
      );
    }

    seasonTotals.set(managerId, seasonTotal);
  }

  const rankedManagers = [...seasonTotals.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([managerId, seasonTotal], index) => ({
      managerId,
      seasonTotal,
      rank: index + 1,
      points: managerPoints.get(managerId) ?? 0,
    }));

  for (const entry of rankedManagers) {
    const previousRank = previousRanks.get(entry.managerId);
    const rankMovement =
      previousRank != null ? previousRank - entry.rank : 0;

    const { error: upsertError } = await supabase.from("fantasy_scores").upsert(
      {
        season_id: seasonId,
        manager_id: entry.managerId,
        gameweek_id: gameweekId,
        points: entry.points,
        season_total: entry.seasonTotal,
        rank: entry.rank,
        rank_movement: rankMovement,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "season_id,manager_id,gameweek_id" }
    );

    if (upsertError) {
      throwResultsError("Failed to save fantasy scores", upsertError.message);
    }
  }

  const publishedAt = new Date().toISOString();
  const { error: publishError } = await supabase
    .from("gameweeks")
    .update({
      status: "published" satisfies GameweekStatus,
      published_at: publishedAt,
    })
    .eq("id", gameweekId);

  if (publishError) {
    throwResultsError("Failed to publish gameweek", publishError.message);
  }

  const updated = await fetchCurrentGameweek();
  if (!updated) throw new Error("Failed to reload gameweek.");
  return { ...updated, status: "published" };
}

export async function fetchLatestRecapForUser(
  userId?: string | null
): Promise<GameweekRecap | null> {
  const supabase = createAdminClient();
  const seasonId = await getCurrentSeasonId();

  const { data: gameweekRow, error: gameweekError } = await supabase
    .from("gameweeks")
    .select("id, number")
    .eq("season_id", seasonId)
    .eq("status", "published")
    .order("number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (gameweekError) {
    throwResultsError("Failed to load published gameweek", gameweekError.message);
  }
  if (!gameweekRow) return null;

  const { data: matchRow } = await supabase
    .from("matches")
    .select("team_a_name, team_b_name, team_a_score, team_b_score")
    .eq("gameweek_id", gameweekRow.id)
    .maybeSingle();

  const { data: topStat } = await supabase
    .from("player_gameweek_stats")
    .select("player_id, fantasy_points")
    .eq("gameweek_id", gameweekRow.id)
    .order("fantasy_points", { ascending: false })
    .limit(1)
    .maybeSingle();

  let highestScorerName = "—";
  if (topStat?.player_id) {
    const players = await fetchPlayersByIds([topStat.player_id]);
    highestScorerName = players[0]?.name ?? highestScorerName;
  }

  let userGameweekPoints = 0;
  let userRankMovement = 0;

  if (userId) {
    const { data: userScore } = await supabase
      .from("fantasy_scores")
      .select("points, rank_movement")
      .eq("gameweek_id", gameweekRow.id)
      .eq("manager_id", userId)
      .maybeSingle();

    userGameweekPoints = userScore?.points ?? 0;
    userRankMovement = userScore?.rank_movement ?? 0;
  }

  const finalScore =
    matchRow?.team_a_score != null && matchRow?.team_b_score != null
      ? `${matchRow.team_a_name} ${matchRow.team_a_score} – ${matchRow.team_b_score} ${matchRow.team_b_name}`
      : "—";

  return {
    gameweekNumber: gameweekRow.number,
    finalScore,
    highestScorerName,
    highestScorerPoints: topStat?.fantasy_points ?? 0,
    userGameweekPoints,
    userRankMovement,
  };
}