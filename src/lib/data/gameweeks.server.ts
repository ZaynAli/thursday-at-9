import { createAdminClient } from "@/lib/supabase/admin";
import { mapGameweekRow } from "@/lib/data/mappers/gameweek";
import type {
  GameweekRow,
  MatchPlayerRow,
  MatchRow,
} from "@/lib/data/db-types";
import type { Gameweek } from "@/types";

export async function fetchCurrentGameweek(): Promise<Gameweek | null> {
  const supabase = createAdminClient();

  const { data: season, error: seasonError } = await supabase
    .from("seasons")
    .select("id")
    .eq("is_current", true)
    .maybeSingle();

  if (seasonError) {
    throw new Error(`Failed to load current season: ${seasonError.message}`);
  }

  let gameweekQuery = supabase.from("gameweeks").select("*");

  if (season?.id) {
    gameweekQuery = gameweekQuery.eq("season_id", season.id);
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
      .select("player_id, team_side")
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
