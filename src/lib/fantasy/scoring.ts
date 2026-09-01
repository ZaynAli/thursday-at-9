import {
  DEFENSIVE_STOP_SCORING_CAP,
  FANTASY_SCORING,
} from "@/lib/constants";

export interface PlayerStatsInput {
  appeared: boolean;
  won: boolean;
  drew: boolean;
  goals: number;
  assists: number;
  defensiveStops: number;
}

export function calculatePlayerFantasyPoints(
  stats: PlayerStatsInput
): number {
  if (!stats.appeared) return 0;

  let points = FANTASY_SCORING.appearance;

  if (stats.won) points += FANTASY_SCORING.win;
  else if (stats.drew) points += FANTASY_SCORING.draw;

  points += stats.goals * FANTASY_SCORING.goal;
  points += stats.assists * FANTASY_SCORING.assist;

  const cappedStops = Math.min(
    stats.defensiveStops,
    DEFENSIVE_STOP_SCORING_CAP
  );
  points += cappedStops * FANTASY_SCORING.defensiveStop;

  return points;
}

export function calculateCaptainPoints(
  points: number,
  isCaptain: boolean
): number {
  return isCaptain ? points * 2 : points;
}

export function calculateTeamGameweekPoints(
  playerPoints: { points: number; isCaptain: boolean }[]
): number {
  return playerPoints.reduce(
    (total, { points, isCaptain }) =>
      total + calculateCaptainPoints(points, isCaptain),
    0
  );
}
