import { createAdminClient } from "@/lib/supabase/admin";
import type { LeagueStanding, PlayerSeasonStats } from "@/types";

async function getCurrentSeasonId(): Promise<string | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("seasons")
    .select("id")
    .eq("is_current", true)
    .maybeSingle();

  if (error) throw new Error(`Failed to load season: ${error.message}`);
  return data?.id ?? null;
}

export async function fetchStandings(
  currentUserId?: string | null
): Promise<LeagueStanding[]> {
  const seasonId = await getCurrentSeasonId();
  if (!seasonId) return [];

  const supabase = createAdminClient();

  const { data: latestGameweek, error: gameweekError } = await supabase
    .from("gameweeks")
    .select("id")
    .eq("season_id", seasonId)
    .eq("status", "published")
    .order("number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (gameweekError) {
    throw new Error(`Failed to load latest gameweek: ${gameweekError.message}`);
  }
  if (!latestGameweek?.id) return [];

  const { data: scoreRows, error: scoresError } = await supabase
    .from("fantasy_scores")
    .select("manager_id, points, season_total, rank, rank_movement")
    .eq("gameweek_id", latestGameweek.id)
    .order("rank", { ascending: true });

  if (scoresError) {
    throw new Error(`Failed to load standings: ${scoresError.message}`);
  }

  if (!scoreRows?.length) return [];

  const managerIds = scoreRows.map((row) => row.manager_id as string);
  const { data: profileRows, error: profilesError } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", managerIds);

  if (profilesError) {
    throw new Error(`Failed to load manager names: ${profilesError.message}`);
  }

  const nameById = new Map(
    (profileRows ?? []).map((row) => [row.id as string, row.display_name as string])
  );

  return scoreRows.map((row) => ({
    rank: row.rank ?? 0,
    managerId: row.manager_id as string,
    managerName: nameById.get(row.manager_id as string) ?? "Manager",
    currentGameweekPoints: row.points as number,
    seasonPoints: row.season_total as number,
    rankMovement: row.rank_movement as number,
    isCurrentUser: currentUserId ? row.manager_id === currentUserId : false,
  }));
}

export async function fetchPlayerSeasonStats(): Promise<PlayerSeasonStats[]> {
  const seasonId = await getCurrentSeasonId();
  if (!seasonId) return [];

  const supabase = createAdminClient();

  const { data: publishedGameweeks, error: gameweekError } = await supabase
    .from("gameweeks")
    .select("id")
    .eq("season_id", seasonId)
    .eq("status", "published");

  if (gameweekError) {
    throw new Error(`Failed to load published gameweeks: ${gameweekError.message}`);
  }

  const gameweekIds = (publishedGameweeks ?? []).map((row) => row.id as string);
  if (gameweekIds.length === 0) return [];

  const { data: statRows, error: statsError } = await supabase
    .from("player_gameweek_stats")
    .select("player_id, appeared, goals, assists, defensive_stops, won, fantasy_points")
    .in("gameweek_id", gameweekIds);

  if (statsError) {
    throw new Error(`Failed to load player stats: ${statsError.message}`);
  }

  const aggregated = new Map<string, PlayerSeasonStats>();

  for (const row of statRows ?? []) {
    const playerId = row.player_id as string;
    const existing = aggregated.get(playerId) ?? {
      playerId,
      appearances: 0,
      goals: 0,
      assists: 0,
      defensiveStops: 0,
      wins: 0,
      fantasyPointsGenerated: 0,
    };

    if (row.appeared) existing.appearances += 1;
    existing.goals += row.goals as number;
    existing.assists += row.assists as number;
    existing.defensiveStops += row.defensive_stops as number;
    if (row.won) existing.wins += 1;
    existing.fantasyPointsGenerated += row.fantasy_points as number;

    aggregated.set(playerId, existing);
  }

  return [...aggregated.values()]
    .filter((stat) => stat.appearances > 0)
    .sort((a, b) => b.fantasyPointsGenerated - a.fantasyPointsGenerated);
}
