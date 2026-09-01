import { CURRENT_USER_ID, getFantasyManagers } from "@/data/mock/profiles";
import type { LeagueStanding, PlayerSeasonStats } from "@/types";
import { mockPlayers } from "./players";

/** Standings include fantasy managers only (~10), not all app users. */
export const mockStandings: LeagueStanding[] = getFantasyManagers()
  .sort((a, b) => (a.managerRank ?? 99) - (b.managerRank ?? 99))
  .map((m) => ({
    rank: m.managerRank!,
    managerId: m.id,
    managerName: m.name,
    currentGameweekPoints: m.recentGameweekPoints?.at(-1) ?? 0,
    seasonPoints: m.totalFantasyPoints!,
    rankMovement: rankMovementFor(m.id),
    isCurrentUser: m.id === CURRENT_USER_ID,
  }));

function rankMovementFor(managerId: string): number {
  const movements: Record<string, number> = {
    ramis: 0,
    zain: 2,
    osama: -1,
    jimmy: -1,
    shaafay: 0,
    ibtehaj: 1,
    nikhil: -1,
    shahrukh: 0,
    ahmed: 1,
    bilal: -1,
  };
  return movements[managerId] ?? 0;
}

export function getStandingsWithCurrentUser(): LeagueStanding[] {
  return mockStandings.map((s) => ({
    ...s,
    isCurrentUser: s.managerId === CURRENT_USER_ID,
  }));
}

/** Season stats for all roster players with at least one appearance. */
export const mockPlayerSeasonStats: PlayerSeasonStats[] = mockPlayers
  .filter((p) => p.appearances > 0)
  .map((p) => ({
    playerId: p.id,
    appearances: p.appearances,
    goals: p.goals,
    assists: p.assists,
    defensiveStops: p.defensiveStops,
    wins: p.wins,
    fantasyPointsGenerated: p.seasonFantasyPoints,
  }));
