import { createAdminClient } from "@/lib/supabase/admin";
import { mapGameweekRow } from "@/lib/data/mappers/gameweek";
import type {
  GameweekRow,
  MatchPlayerRow,
  MatchRow,
} from "@/lib/data/db-types";
import type { Gameweek } from "@/types";

async function fetchCurrentSeasonId(): Promise<string | null> {
  const supabase = createAdminClient();
  const { data: season, error: seasonError } = await supabase
    .from("seasons")
    .select("id")
    .eq("is_current", true)
    .maybeSingle();

  if (seasonError) {
    throw new Error(`Failed to load current season: ${seasonError.message}`);
  }

  return season?.id ?? null;
}

/** Highest gameweek number in the current season + 1 (or 1 if none). */
export async function fetchNextGameweekNumber(
  seasonId?: string | null
): Promise<number> {
  const supabase = createAdminClient();
  const resolvedSeasonId =
    seasonId === undefined ? await fetchCurrentSeasonId() : seasonId;

  let query = supabase
    .from("gameweeks")
    .select("number")
    .order("number", { ascending: false })
    .limit(1);

  if (resolvedSeasonId) {
    query = query.eq("season_id", resolvedSeasonId);
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    throw new Error(`Failed to load gameweek number: ${error.message}`);
  }

  return (data?.number ?? 0) + 1;
}

export async function fetchCurrentGameweek(): Promise<Gameweek | null> {
  const supabase = createAdminClient();
  const seasonId = await fetchCurrentSeasonId();

  let gameweekQuery = supabase.from("gameweeks").select("*");

  if (seasonId) {
    gameweekQuery = gameweekQuery.eq("season_id", seasonId);
  }

  const { data: gameweekRows, error: gameweekError } = await gameweekQuery
    .order("number", { ascending: false })
    .limit(1);

  if (gameweekError) {
    throw new Error(`Failed to load gameweek: ${gameweekError.message}`);
  }

  const row = (gameweekRows?.[0] as GameweekRow | undefined) ?? null;
  if (!row) return null;

  const [{ data: poolRows }, { data: matchRow }] = await Promise.all([
    supabase
      .from("gameweek_players")
      .select("player_id")
      .eq("gameweek_id", row.id),
    supabase.from("matches").select("*").eq("gameweek_id", row.id).maybeSingle(),
  ]);

  const playerIds = (poolRows ?? []).map(
    (entry: { player_id: string }) => entry.player_id
  );

  let matchPlayers: MatchPlayerRow[] = [];
  if (matchRow) {
    const { data: assignmentRows } = await supabase
      .from("match_players")
      .select("player_id, team_side, position_index")
      .eq("match_id", (matchRow as MatchRow).id);
    matchPlayers = (assignmentRows ?? []) as MatchPlayerRow[];
  }

  return mapGameweekRow(
    row,
    playerIds,
    (matchRow as MatchRow | null) ?? null,
    matchPlayers
  );
}

const RESULTS_ELIGIBLE_STATUSES = [
  "selection_locked",
  "in_progress",
  "results_pending",
] as const;

/**
 * Latest gameweek that still needs scores entered (not draft / open / published).
 * Survives starting the next session before the previous one is published.
 */
export async function fetchGameweekNeedingResults(): Promise<Gameweek | null> {
  const supabase = createAdminClient();
  const seasonId = await fetchCurrentSeasonId();

  let query = supabase
    .from("gameweeks")
    .select("*")
    .in("status", [...RESULTS_ELIGIBLE_STATUSES])
    .order("number", { ascending: false })
    .limit(1);

  if (seasonId) {
    query = query.eq("season_id", seasonId);
  }

  const { data: gameweekRows, error: gameweekError } = await query;

  if (gameweekError) {
    throw new Error(`Failed to load results gameweek: ${gameweekError.message}`);
  }

  const row = (gameweekRows?.[0] as GameweekRow | undefined) ?? null;
  if (!row) return null;

  const [{ data: poolRows }, { data: matchRow }] = await Promise.all([
    supabase
      .from("gameweek_players")
      .select("player_id")
      .eq("gameweek_id", row.id),
    supabase.from("matches").select("*").eq("gameweek_id", row.id).maybeSingle(),
  ]);

  const playerIds = (poolRows ?? []).map(
    (entry: { player_id: string }) => entry.player_id
  );

  let matchPlayers: MatchPlayerRow[] = [];
  if (matchRow) {
    const { data: assignmentRows } = await supabase
      .from("match_players")
      .select("player_id, team_side, position_index")
      .eq("match_id", (matchRow as MatchRow).id);
    matchPlayers = (assignmentRows ?? []) as MatchPlayerRow[];
  }

  return mapGameweekRow(
    row,
    playerIds,
    (matchRow as MatchRow | null) ?? null,
    matchPlayers
  );
}

export async function fetchGameweekById(
  gameweekId: string
): Promise<Gameweek | null> {
  const supabase = createAdminClient();
  const { data: row, error } = await supabase
    .from("gameweeks")
    .select("*")
    .eq("id", gameweekId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load gameweek: ${error.message}`);
  }
  if (!row) return null;

  const [{ data: poolRows }, { data: matchRow }] = await Promise.all([
    supabase
      .from("gameweek_players")
      .select("player_id")
      .eq("gameweek_id", row.id),
    supabase.from("matches").select("*").eq("gameweek_id", row.id).maybeSingle(),
  ]);

  const playerIds = (poolRows ?? []).map(
    (entry: { player_id: string }) => entry.player_id
  );

  let matchPlayers: MatchPlayerRow[] = [];
  if (matchRow) {
    const { data: assignmentRows } = await supabase
      .from("match_players")
      .select("player_id, team_side, position_index")
      .eq("match_id", (matchRow as MatchRow).id);
    matchPlayers = (assignmentRows ?? []) as MatchPlayerRow[];
  }

  return mapGameweekRow(
    row as GameweekRow,
    playerIds,
    (matchRow as MatchRow | null) ?? null,
    matchPlayers
  );
}
