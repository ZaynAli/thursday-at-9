import { GAME_TIME } from "@/lib/constants";
import {
  buildDefaultFormation,
  formationFromSlotMap,
} from "@/lib/formations";
import type { MatchPlayerRow, MatchRow, GameweekRow } from "@/lib/data/db-types";
import type { Gameweek, MatchScores } from "@/types";
import type { SessionTeam } from "@/lib/session-formats";

export function mapGameweekRow(
  row: GameweekRow,
  playerIds: string[],
  match?: MatchRow | null,
  matchPlayers?: MatchPlayerRow[]
): Gameweek {
  const teamAssignments: Record<string, SessionTeam> = {};
  const slotMap: Record<string, { team: SessionTeam; slot: number }> = {};

  matchPlayers?.forEach(({ player_id, team_side, position_index }) => {
    const team: SessionTeam = team_side === "a" ? "white" : "color";
    teamAssignments[player_id] = team;
    if (position_index != null) {
      slotMap[player_id] = { team, slot: position_index };
    }
  });

  let teamFormation = Object.keys(slotMap).length
    ? formationFromSlotMap(slotMap, row.format)
    : undefined;

  if (!teamFormation && Object.keys(teamAssignments).length > 0) {
    teamFormation = buildDefaultFormation(teamAssignments, row.format);
  }

  const matchScores: MatchScores | undefined =
    match?.team_a_score != null || match?.team_b_score != null
      ? {
          white: match?.team_a_score ?? null,
          color: match?.team_b_score ?? null,
        }
      : undefined;

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
    teamFormation,
    matchScores,
  };
}
