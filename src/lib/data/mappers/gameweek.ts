import { GAME_TIME } from "@/lib/constants";
import type { MatchPlayerRow, MatchRow, GameweekRow } from "@/lib/data/db-types";
import type { Gameweek } from "@/types";
import type { SessionTeam } from "@/lib/session-formats";

export function mapGameweekRow(
  row: GameweekRow,
  playerIds: string[],
  match?: MatchRow | null,
  matchPlayers?: MatchPlayerRow[]
): Gameweek {
  const teamAssignments: Record<string, SessionTeam> = {};
  matchPlayers?.forEach(({ player_id, team_side }) => {
    teamAssignments[player_id] = team_side === "a" ? "white" : "color";
  });

  return {
    id: row.id,
    number: row.number,
    date: row.scheduled_at,
    gameTime: GAME_TIME.label,
    fantasyDeadline: row.fantasy_deadline,
    status: row.status,
    availablePlayerIds: playerIds,
    format: row.format,
    teamWhiteName: match?.team_a_name,
    teamColorName: match?.team_b_name,
    teamAssignments:
      Object.keys(teamAssignments).length > 0 ? teamAssignments : undefined,
  };
}
