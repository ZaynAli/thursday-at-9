import { useMockData } from "@/lib/data/config";
import {
  fetchManagerGameweekReview,
  type ManagerGameweekReview,
  type ManagerSquadPlayer,
} from "@/lib/data/manager-review.server";
import { getProfileById as mockGetProfileById } from "@/data/mock/profiles";
import { getCurrentGameweek as mockGetCurrentGameweek } from "@/data/mock/gameweeks";
import { mockStandings } from "@/data/mock/standings";
import { mockPlayers } from "@/data/mock/players";
import { calculateCaptainPoints } from "@/lib/fantasy/scoring";
import { resolveJerseyId } from "@/lib/jerseys";
import { GW08_PLAYER_IDS } from "@/data/mock/gameweeks";

export type { ManagerGameweekReview, ManagerSquadPlayer };

/** Deterministic mock squad per manager for league detail previews. */
function mockSquadForManager(managerId: string): ManagerSquadPlayer[] {
  const pool = [...GW08_PLAYER_IDS];
  const offset = Math.abs(
    managerId.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0)
  );
  const picks = Array.from({ length: 5 }, (_, i) => pool[(offset + i) % pool.length]!);

  return picks.map((playerId, index) => {
    const player = mockPlayers.find((p) => p.id === playerId)!;
    const isCaptain = index === 0;
    const basePoints = player.lastGameweekPoints;
    return {
      playerId,
      name: player.name,
      initials: player.initials,
      jerseyId: resolveJerseyId(player.jerseyId),
      isCaptain,
      basePoints,
      appliedPoints: calculateCaptainPoints(basePoints, isCaptain),
      stats: {
        appeared: true,
        won: player.wins > 0,
        drew: false,
        goals: Math.min(player.goals, 2),
        assists: Math.min(player.assists, 1),
        defensiveStops: Math.min(player.defensiveStops, 2),
      },
    };
  });
}

function mockManagerReview(
  managerId: string,
  currentUserId?: string | null
): ManagerGameweekReview | null {
  const profile = mockGetProfileById(managerId);
  if (!profile) return null;

  const gameweek = {
    ...mockGetCurrentGameweek(),
    status: "published" as const,
  };
  const standing =
    mockStandings.find((s) => s.managerId === managerId) ?? null;
  const squad = mockSquadForManager(managerId);
  const teamTotal = squad.reduce((sum, p) => sum + (p.appliedPoints ?? 0), 0);

  return {
    profile,
    standing: standing
      ? {
          ...standing,
          isCurrentUser: currentUserId
            ? standing.managerId === currentUserId
            : standing.isCurrentUser,
          currentGameweekPoints: teamTotal,
        }
      : null,
    gameweek,
    squad,
    teamTotal,
    showPoints: true,
    isSubmitted: true,
  };
}

export async function getManagerGameweekReview(
  managerId: string,
  options?: { gameweekId?: string; currentUserId?: string | null }
): Promise<ManagerGameweekReview | null> {
  if (useMockData()) {
    return mockManagerReview(managerId, options?.currentUserId);
  }
  return fetchManagerGameweekReview(managerId, options);
}
