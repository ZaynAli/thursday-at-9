import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { preferPlayerName } from "@/lib/data/display-names";
import type { LeagueStanding, PlayerSeasonStats, Profile } from "@/types";

const getCurrentSeasonId = cache(async (): Promise<string | null> => {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("seasons")
    .select("id")
    .eq("is_current", true)
    .maybeSingle();

  if (error) throw new Error(`Failed to load season: ${error.message}`);
  return data?.id ?? null;
});

/** Map manager profile ids → display name (linked player name when available). */
async function fetchManagerDisplayNames(
  managerIds: string[]
): Promise<Map<string, string>> {
  if (managerIds.length === 0) return new Map();

  const supabase = createAdminClient();
  const { data: profileRows, error: profilesError } = await supabase
    .from("profiles")
    .select("id, display_name, player_id")
    .in("id", managerIds);

  if (profilesError) {
    throw new Error(`Failed to load manager names: ${profilesError.message}`);
  }

  const playerIds = (profileRows ?? [])
    .map((row) => row.player_id as string | null)
    .filter((id): id is string => Boolean(id));

  const playerNameById = new Map<string, string>();
  if (playerIds.length > 0) {
    const { data: playerRows, error: playersError } = await supabase
      .from("players")
      .select("id, name")
      .in("id", playerIds);

    if (playersError) {
      throw new Error(`Failed to load player names: ${playersError.message}`);
    }

    for (const row of playerRows ?? []) {
      playerNameById.set(row.id as string, row.name as string);
    }
  }

  const nameByManagerId = new Map<string, string>();
  for (const row of profileRows ?? []) {
    const profileName = (row.display_name as string) ?? "Manager";
    const playerId = row.player_id as string | null;
    nameByManagerId.set(
      row.id as string,
      preferPlayerName(
        profileName,
        playerId ? playerNameById.get(playerId) : null
      )
    );
  }

  return nameByManagerId;
}

export const fetchStandings = cache(async function fetchStandings(
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
  const nameById = await fetchManagerDisplayNames(managerIds);

  return scoreRows.map((row) => ({
    rank: row.rank ?? 0,
    managerId: row.manager_id as string,
    managerName: nameById.get(row.manager_id as string) ?? "Manager",
    currentGameweekPoints: row.points as number,
    seasonPoints: row.season_total as number,
    rankMovement: row.rank_movement as number,
    isCurrentUser: currentUserId ? row.manager_id === currentUserId : false,
  }));
});

export interface PlayerSeasonAggregate {
  appearances: number;
  goals: number;
  assists: number;
  defensiveStops: number;
  wins: number;
  seasonFantasyPoints: number;
  lastGameweekPoints: number;
}

/** Season totals from published gameweeks, keyed by player id. */
export const fetchPlayerSeasonAggregates = cache(
  async (): Promise<Map<string, PlayerSeasonAggregate>> => {
    const seasonId = await getCurrentSeasonId();
    if (!seasonId) return new Map();

    const supabase = createAdminClient();

    const { data: publishedGameweeks, error: gameweekError } = await supabase
      .from("gameweeks")
      .select("id, number")
      .eq("season_id", seasonId)
      .eq("status", "published")
      .order("number", { ascending: false });

    if (gameweekError) {
      throw new Error(
        `Failed to load published gameweeks: ${gameweekError.message}`
      );
    }

    const gameweekIds = (publishedGameweeks ?? []).map((row) => row.id as string);
    if (gameweekIds.length === 0) return new Map();

    const latestGameweekId = gameweekIds[0]!;

    const { data: statRows, error: statsError } = await supabase
      .from("player_gameweek_stats")
      .select(
        "player_id, gameweek_id, appeared, goals, assists, defensive_stops, won, fantasy_points"
      )
      .in("gameweek_id", gameweekIds);

    if (statsError) {
      throw new Error(`Failed to load player stats: ${statsError.message}`);
    }

    const aggregated = new Map<string, PlayerSeasonAggregate>();

    for (const row of statRows ?? []) {
      const playerId = row.player_id as string;
      const existing = aggregated.get(playerId) ?? {
        appearances: 0,
        goals: 0,
        assists: 0,
        defensiveStops: 0,
        wins: 0,
        seasonFantasyPoints: 0,
        lastGameweekPoints: 0,
      };

      if (row.appeared) existing.appearances += 1;
      existing.goals += (row.goals as number) ?? 0;
      existing.assists += (row.assists as number) ?? 0;
      existing.defensiveStops += (row.defensive_stops as number) ?? 0;
      if (row.won) existing.wins += 1;
      existing.seasonFantasyPoints += (row.fantasy_points as number) ?? 0;
      if (row.gameweek_id === latestGameweekId) {
        existing.lastGameweekPoints = (row.fantasy_points as number) ?? 0;
      }

      aggregated.set(playerId, existing);
    }

    return aggregated;
  }
);

export async function fetchPlayerSeasonStats(): Promise<PlayerSeasonStats[]> {
  const aggregates = await fetchPlayerSeasonAggregates();

  return [...aggregates.entries()]
    .map(([playerId, stats]) => ({
      playerId,
      appearances: stats.appearances,
      goals: stats.goals,
      assists: stats.assists,
      defensiveStops: stats.defensiveStops,
      wins: stats.wins,
      fantasyPointsGenerated: stats.seasonFantasyPoints,
    }))
    .filter((stat) => stat.appearances > 0)
    .sort((a, b) => b.fantasyPointsGenerated - a.fantasyPointsGenerated);
}

export type ManagerProfileStats = Pick<
  Profile,
  | "managerRank"
  | "totalFantasyPoints"
  | "averageGameweekPoints"
  | "bestGameweek"
  | "bestGameweekNumber"
  | "captainPointsTotal"
  | "captainPickRate"
  | "recentGameweekPoints"
  | "recentGameweekNumbers"
>;

/** Derive manager profile cards from published fantasy_scores + captain picks. */
export async function fetchManagerProfileStats(
  managerId: string
): Promise<ManagerProfileStats | null> {
  const seasonId = await getCurrentSeasonId();
  if (!seasonId) return null;

  const supabase = createAdminClient();

  const { data: scoreRows, error: scoresError } = await supabase
    .from("fantasy_scores")
    .select("gameweek_id, points, season_total, rank")
    .eq("season_id", seasonId)
    .eq("manager_id", managerId);

  if (scoresError) {
    throw new Error(`Failed to load manager scores: ${scoresError.message}`);
  }
  if (!scoreRows?.length) return null;

  const gameweekIds = scoreRows.map((row) => row.gameweek_id as string);
  const { data: gameweekRows, error: gameweekError } = await supabase
    .from("gameweeks")
    .select("id, number, status")
    .in("id", gameweekIds);

  if (gameweekError) {
    throw new Error(`Failed to load manager gameweeks: ${gameweekError.message}`);
  }

  const gameweekById = new Map(
    (gameweekRows ?? []).map((row) => [
      row.id as string,
      { number: row.number as number, status: row.status as string },
    ])
  );

  const publishedScores = scoreRows
    .map((row) => {
      const gw = gameweekById.get(row.gameweek_id as string);
      if (!gw || gw.status !== "published") return null;
      return {
        gameweekId: row.gameweek_id as string,
        number: gw.number,
        points: (row.points as number) ?? 0,
        seasonTotal: (row.season_total as number) ?? 0,
        rank: row.rank as number | null,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row != null)
    .sort((a, b) => a.number - b.number);

  if (publishedScores.length === 0) return null;

  const latest = publishedScores[publishedScores.length - 1]!;
  const best = publishedScores.reduce((acc, row) =>
    row.points > acc.points ? row : acc
  );
  const average =
    publishedScores.reduce((sum, row) => sum + row.points, 0) /
    publishedScores.length;

  const recent = publishedScores.slice(-5);

  const { data: teamRows, error: teamsError } = await supabase
    .from("fantasy_teams")
    .select("id, gameweek_id")
    .eq("manager_id", managerId)
    .in(
      "gameweek_id",
      publishedScores.map((row) => row.gameweekId)
    )
    .not("submitted_at", "is", null);

  if (teamsError) {
    throw new Error(`Failed to load manager teams: ${teamsError.message}`);
  }

  let captainPointsTotal = 0;
  let captainScoredWeeks = 0;
  let captainWeeks = 0;

  const teams = teamRows ?? [];
  if (teams.length > 0) {
    const teamIds = teams.map((row) => row.id as string);
    const { data: captainRows, error: captainError } = await supabase
      .from("fantasy_selections")
      .select("fantasy_team_id, player_id")
      .in("fantasy_team_id", teamIds)
      .eq("is_captain", true);

    if (captainError) {
      throw new Error(`Failed to load captain picks: ${captainError.message}`);
    }

    const teamGameweekById = new Map(
      teams.map((row) => [row.id as string, row.gameweek_id as string])
    );
    const captainByGameweek = new Map<string, string>();
    for (const row of captainRows ?? []) {
      const gameweekId = teamGameweekById.get(row.fantasy_team_id as string);
      if (gameweekId) {
        captainByGameweek.set(gameweekId, row.player_id as string);
      }
    }

    const captainPlayerIds = [...new Set(captainByGameweek.values())];
    if (captainPlayerIds.length > 0) {
      const { data: captainStats, error: captainStatsError } = await supabase
        .from("player_gameweek_stats")
        .select("gameweek_id, player_id, fantasy_points")
        .in("gameweek_id", [...captainByGameweek.keys()])
        .in("player_id", captainPlayerIds);

      if (captainStatsError) {
        throw new Error(
          `Failed to load captain points: ${captainStatsError.message}`
        );
      }

      const pointsByKey = new Map(
        (captainStats ?? []).map((row) => [
          `${row.gameweek_id}:${row.player_id}`,
          (row.fantasy_points as number) ?? 0,
        ])
      );

      for (const [gameweekId, playerId] of captainByGameweek) {
        const base = pointsByKey.get(`${gameweekId}:${playerId}`) ?? 0;
        captainWeeks += 1;
        captainPointsTotal += base * 2;
        if (base > 0) captainScoredWeeks += 1;
      }
    }
  }

  return {
    managerRank: latest.rank ?? undefined,
    totalFantasyPoints: latest.seasonTotal,
    averageGameweekPoints: Math.round(average * 10) / 10,
    bestGameweek: best.points,
    bestGameweekNumber: best.number,
    captainPointsTotal,
    captainPickRate:
      captainWeeks > 0
        ? Math.round((captainScoredWeeks / captainWeeks) * 100)
        : 0,
    recentGameweekPoints: recent.map((row) => row.points),
    recentGameweekNumbers: recent.map((row) => row.number),
  };
}
