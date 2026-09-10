import { createAdminClient } from "@/lib/supabase/admin";
import { fetchProfileById } from "@/lib/data/profiles.server";
import { fetchFantasyTeamForManager } from "@/lib/data/fantasy-teams.server";
import { fetchPlayersByIds } from "@/lib/data/players.server";
import { mapGameweekRow } from "@/lib/data/mappers/gameweek";
import { calculateCaptainPoints } from "@/lib/fantasy/scoring";
import { resolveJerseyId, type JerseyId } from "@/lib/jerseys";
import type {
  GameweekRow,
  MatchPlayerRow,
  MatchRow,
} from "@/lib/data/db-types";
import type { Gameweek, LeagueStanding, Profile } from "@/types";

export interface ManagerSquadPlayer {
  playerId: string;
  name: string;
  initials: string;
  jerseyId: JerseyId;
  isCaptain: boolean;
  /** Raw player GW points (null before publish). */
  basePoints: number | null;
  /** Points counting toward the manager (captain ×2). */
  appliedPoints: number | null;
  /** Stat line used for the point breakdown sheet (null before publish). */
  stats: {
    appeared: boolean;
    won: boolean;
    drew: boolean;
    goals: number;
    assists: number;
    defensiveStops: number;
  } | null;
}

export interface ManagerGameweekReview {
  profile: Profile;
  standing: LeagueStanding | null;
  gameweek: Gameweek;
  squad: ManagerSquadPlayer[];
  /** Manager total for this gameweek when scored. */
  teamTotal: number | null;
  showPoints: boolean;
  isSubmitted: boolean;
}

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

async function loadGameweekById(gameweekId: string): Promise<Gameweek | null> {
  const supabase = createAdminClient();
  const { data: row, error } = await supabase
    .from("gameweeks")
    .select("*")
    .eq("id", gameweekId)
    .maybeSingle();

  if (error) throw new Error(`Failed to load gameweek: ${error.message}`);
  if (!row) return null;

  const [{ data: poolRows }, { data: matchRow }] = await Promise.all([
    supabase.from("gameweek_players").select("player_id").eq("gameweek_id", gameweekId),
    supabase.from("matches").select("*").eq("gameweek_id", gameweekId).maybeSingle(),
  ]);

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
    (poolRows ?? []).map((entry) => entry.player_id as string),
    (matchRow as MatchRow | null) ?? null,
    matchPlayers
  );
}

/** Latest published gameweek in the current season (for scored league reviews). */
export async function fetchLatestPublishedGameweek(): Promise<Gameweek | null> {
  const seasonId = await getCurrentSeasonId();
  if (!seasonId) return null;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("gameweeks")
    .select("id")
    .eq("season_id", seasonId)
    .eq("status", "published")
    .order("number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Failed to load published gameweek: ${error.message}`);
  if (!data?.id) return null;
  return loadGameweekById(data.id as string);
}

async function fetchStandingForManager(
  gameweekId: string,
  managerId: string,
  currentUserId?: string | null
): Promise<LeagueStanding | null> {
  const supabase = createAdminClient();
  const { data: scoreRow, error } = await supabase
    .from("fantasy_scores")
    .select("manager_id, points, season_total, rank, rank_movement")
    .eq("gameweek_id", gameweekId)
    .eq("manager_id", managerId)
    .maybeSingle();

  if (error) throw new Error(`Failed to load manager score: ${error.message}`);
  if (!scoreRow) return null;

  const profile = await fetchProfileById(managerId);

  return {
    rank: (scoreRow.rank as number) ?? 0,
    managerId,
    managerName: profile?.name ?? "Manager",
    currentGameweekPoints: scoreRow.points as number,
    seasonPoints: scoreRow.season_total as number,
    rankMovement: (scoreRow.rank_movement as number) ?? 0,
    isCurrentUser: currentUserId ? managerId === currentUserId : false,
  };
}

/**
 * Manager's submitted fantasy team for a gameweek, with per-player points when published.
 */
export async function fetchManagerGameweekReview(
  managerId: string,
  options?: { gameweekId?: string; currentUserId?: string | null }
): Promise<ManagerGameweekReview | null> {
  const profile = await fetchProfileById(managerId);
  if (!profile) return null;

  let gameweek: Gameweek | null = null;
  if (options?.gameweekId) {
    gameweek = await loadGameweekById(options.gameweekId);
  } else {
    gameweek = await fetchLatestPublishedGameweek();
    if (!gameweek) {
      // Fall back to current gameweek (selection still open / not published yet).
      const { fetchCurrentGameweek } = await import("@/lib/data/gameweeks.server");
      gameweek = await fetchCurrentGameweek();
    }
  }

  if (!gameweek || gameweek.id === "draft") {
    return {
      profile,
      standing: null,
      gameweek: gameweek ?? {
        id: "draft",
        number: 1,
        date: new Date().toISOString(),
        gameTime: "9:30 PM",
        fantasyDeadline: new Date().toISOString(),
        status: "draft",
        availablePlayerIds: [],
        format: "7v7",
      },
      squad: [],
      teamTotal: null,
      showPoints: false,
      isSubmitted: false,
    };
  }

  const [standing, fantasyTeam] = await Promise.all([
    fetchStandingForManager(gameweek.id, managerId, options?.currentUserId),
    fetchFantasyTeamForManager(gameweek.id, managerId),
  ]);

  const showPoints = gameweek.status === "published";
  const isSubmitted = Boolean(fantasyTeam?.submittedAt);
  const selections = fantasyTeam?.selections ?? [];

  if (selections.length === 0) {
    return {
      profile,
      standing,
      gameweek,
      squad: [],
      teamTotal: showPoints ? (standing?.currentGameweekPoints ?? 0) : null,
      showPoints,
      isSubmitted,
    };
  }

  const playerIds = selections.map((s) => s.playerId);
  const players = await fetchPlayersByIds(playerIds);
  const playerById = new Map(players.map((p) => [p.id, p]));

  const pointsByPlayer = new Map<string, number>();
  const statsByPlayer = new Map<
    string,
    {
      appeared: boolean;
      won: boolean;
      drew: boolean;
      goals: number;
      assists: number;
      defensiveStops: number;
    }
  >();

  if (showPoints) {
    const supabase = createAdminClient();
    const { data: statRows, error: statsError } = await supabase
      .from("player_gameweek_stats")
      .select(
        "player_id, fantasy_points, appeared, won, drew, goals, assists, defensive_stops"
      )
      .eq("gameweek_id", gameweek.id)
      .in("player_id", playerIds);

    if (statsError) {
      throw new Error(`Failed to load player points: ${statsError.message}`);
    }

    for (const row of statRows ?? []) {
      const playerId = row.player_id as string;
      pointsByPlayer.set(playerId, (row.fantasy_points as number) ?? 0);
      statsByPlayer.set(playerId, {
        appeared: Boolean(row.appeared),
        won: Boolean(row.won),
        drew: Boolean(row.drew),
        goals: (row.goals as number) ?? 0,
        assists: (row.assists as number) ?? 0,
        defensiveStops: (row.defensive_stops as number) ?? 0,
      });
    }
  }

  const squad: ManagerSquadPlayer[] = selections.map((selection) => {
    const player = playerById.get(selection.playerId);
    const basePoints = showPoints ? (pointsByPlayer.get(selection.playerId) ?? 0) : null;
    const appliedPoints =
      basePoints == null
        ? null
        : calculateCaptainPoints(basePoints, selection.isCaptain);

    return {
      playerId: selection.playerId,
      name: player?.name ?? "Player",
      initials: player?.initials ?? "??",
      jerseyId: resolveJerseyId(player?.jerseyId),
      isCaptain: selection.isCaptain,
      basePoints,
      appliedPoints,
      stats: showPoints
        ? (statsByPlayer.get(selection.playerId) ?? {
            appeared: false,
            won: false,
            drew: false,
            goals: 0,
            assists: 0,
            defensiveStops: 0,
          })
        : null,
    };
  });

  const teamTotal = showPoints
    ? squad.reduce((sum, p) => sum + (p.appliedPoints ?? 0), 0)
    : null;

  return {
    profile,
    standing,
    gameweek,
    squad,
    teamTotal: teamTotal ?? standing?.currentGameweekPoints ?? null,
    showPoints,
    isSubmitted,
  };
}
