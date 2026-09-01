import { getPlayerPrice } from "@/lib/fantasy/pricing";
import type { Player } from "@/types";

function player(
  id: string,
  name: string,
  skillLevel: 1 | 2 | 3 | 4 | 5,
  opts: {
    profileId?: string;
    isActive?: boolean;
    stats?: Partial<
      Omit<
        Player,
        | "id"
        | "name"
        | "initials"
        | "skillLevel"
        | "price"
        | "isActive"
        | "profileId"
      >
    >;
  } = {}
): Player {
  const { profileId, isActive = true, stats = {} } = opts;
  const initials = name
    .split(/[\s.]+/)
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return {
    id,
    name,
    initials,
    skillLevel,
    price: getPlayerPrice(skillLevel),
    isActive,
    profileId,
    form: stats.form ?? 5.0,
    lastGameweekPoints: stats.lastGameweekPoints ?? 0,
    seasonFantasyPoints: stats.seasonFantasyPoints ?? 0,
    ownershipPercent: stats.ownershipPercent ?? 0,
    appearances: stats.appearances ?? 0,
    goals: stats.goals ?? 0,
    assists: stats.assists ?? 0,
    defensiveStops: stats.defensiveStops ?? 0,
    wins: stats.wins ?? 0,
  };
}

/** Full group roster (~18). Not all play every week. */
export const mockPlayers: Player[] = [
  // ── GW08 pool (14 playing this week) ──────────────────────────────────────
  player("jimmy", "Jimmy", 5, {
    profileId: "jimmy",
    stats: {
      form: 8.7,
      lastGameweekPoints: 14,
      seasonFantasyPoints: 142,
      ownershipPercent: 68,
      appearances: 7,
      goals: 9,
      assists: 4,
      defensiveStops: 2,
      wins: 5,
    },
  }),
  player("ramis", "Ramis", 4, {
    profileId: "ramis",
    stats: {
      form: 8.2,
      lastGameweekPoints: 18,
      seasonFantasyPoints: 128,
      ownershipPercent: 72,
      appearances: 7,
      goals: 7,
      assists: 6,
      defensiveStops: 4,
      wins: 4,
    },
  }),
  player("osama", "Osama", 4, {
    profileId: "osama",
    stats: {
      form: 7.9,
      lastGameweekPoints: 11,
      seasonFantasyPoints: 119,
      ownershipPercent: 55,
      appearances: 6,
      goals: 5,
      assists: 5,
      defensiveStops: 3,
      wins: 3,
    },
  }),
  player("ibrahim-o", "Ibrahim O.", 4, {
    stats: {
      form: 7.5,
      lastGameweekPoints: 9,
      seasonFantasyPoints: 98,
      ownershipPercent: 42,
      appearances: 6,
      goals: 4,
      assists: 3,
      defensiveStops: 5,
      wins: 3,
    },
  }),
  player("zain", "Zain", 3, {
    profileId: "zain",
    stats: {
      form: 7.1,
      lastGameweekPoints: 12,
      seasonFantasyPoints: 104,
      ownershipPercent: 48,
      appearances: 7,
      goals: 6,
      assists: 2,
      defensiveStops: 6,
      wins: 4,
    },
  }),
  player("shaafay", "Shaafay", 3, {
    profileId: "shaafay",
    stats: {
      form: 6.8,
      lastGameweekPoints: 8,
      seasonFantasyPoints: 87,
      ownershipPercent: 35,
      appearances: 6,
      goals: 3,
      assists: 4,
      defensiveStops: 2,
      wins: 3,
    },
  }),
  player("shahrukh", "Shahrukh", 3, {
    profileId: "shahrukh",
    stats: {
      form: 6.5,
      lastGameweekPoints: 6,
      seasonFantasyPoints: 76,
      ownershipPercent: 28,
      appearances: 5,
      goals: 2,
      assists: 5,
      defensiveStops: 1,
      wins: 2,
    },
  }),
  player("ibtehaj", "Ibtehaj", 3, {
    profileId: "ibtehaj",
    stats: {
      form: 6.3,
      lastGameweekPoints: 10,
      seasonFantasyPoints: 82,
      ownershipPercent: 38,
      appearances: 6,
      goals: 4,
      assists: 2,
      defensiveStops: 3,
      wins: 3,
    },
  }),
  player("taha", "Taha", 3, {
    stats: {
      form: 6.0,
      lastGameweekPoints: 5,
      seasonFantasyPoints: 68,
      ownershipPercent: 22,
      appearances: 5,
      goals: 2,
      assists: 3,
      defensiveStops: 4,
      wins: 2,
    },
  }),
  player("nikhil", "Nikhil", 2, {
    profileId: "nikhil",
    stats: {
      form: 5.8,
      lastGameweekPoints: 7,
      seasonFantasyPoints: 71,
      ownershipPercent: 31,
      appearances: 6,
      goals: 3,
      assists: 1,
      defensiveStops: 5,
      wins: 3,
    },
  }),
  player("owais", "Owais", 2, {
    stats: {
      form: 5.5,
      lastGameweekPoints: 4,
      seasonFantasyPoints: 58,
      ownershipPercent: 18,
      appearances: 5,
      goals: 1,
      assists: 2,
      defensiveStops: 3,
      wins: 2,
    },
  }),
  player("zahin", "Zahin", 2, {
    stats: {
      form: 5.2,
      lastGameweekPoints: 3,
      seasonFantasyPoints: 52,
      ownershipPercent: 15,
      appearances: 4,
      goals: 2,
      assists: 1,
      defensiveStops: 2,
      wins: 1,
    },
  }),
  player("abdul", "Abdul", 2, {
    stats: {
      form: 5.0,
      lastGameweekPoints: 6,
      seasonFantasyPoints: 61,
      ownershipPercent: 25,
      appearances: 5,
      goals: 2,
      assists: 3,
      defensiveStops: 4,
      wins: 2,
    },
  }),
  player("ibrahim", "Ibrahim", 2, {
    stats: {
      form: 4.8,
      lastGameweekPoints: 2,
      seasonFantasyPoints: 45,
      ownershipPercent: 12,
      appearances: 4,
      goals: 1,
      assists: 1,
      defensiveStops: 3,
      wins: 1,
    },
  }),

  // ── In roster, not playing GW08 ───────────────────────────────────────────
  player("hassan", "Hassan", 3, {
    stats: {
      form: 5.6,
      lastGameweekPoints: 0,
      seasonFantasyPoints: 54,
      ownershipPercent: 0,
      appearances: 4,
      goals: 2,
      assists: 1,
      defensiveStops: 2,
      wins: 2,
    },
  }),
  player("faraz", "Faraz", 2, {
    stats: {
      form: 4.9,
      lastGameweekPoints: 0,
      seasonFantasyPoints: 38,
      ownershipPercent: 0,
      appearances: 3,
      goals: 1,
      assists: 2,
      defensiveStops: 1,
      wins: 1,
    },
  }),
  player("ali", "Ali", 2, {
    stats: {
      form: 4.5,
      lastGameweekPoints: 0,
      seasonFantasyPoints: 29,
      ownershipPercent: 0,
      appearances: 2,
      goals: 0,
      assists: 1,
      defensiveStops: 2,
      wins: 1,
    },
  }),
  player("usman", "Usman", 2, {
    stats: {
      form: 4.2,
      lastGameweekPoints: 0,
      seasonFantasyPoints: 22,
      ownershipPercent: 0,
      appearances: 2,
      goals: 1,
      assists: 0,
      defensiveStops: 1,
      wins: 0,
    },
  }),
];

export function getPlayerById(id: string): Player | undefined {
  return mockPlayers.find((p) => p.id === id);
}

export function getAvailablePlayers(ids: string[]): Player[] {
  return mockPlayers.filter((p) => ids.includes(p.id) && p.isActive);
}

export function getRosterPlayers(): Player[] {
  return mockPlayers.filter((p) => p.isActive);
}

export function getPlayersWithoutProfile(): Player[] {
  return mockPlayers.filter((p) => p.isActive && !p.profileId);
}

export function getProfileIdForPlayer(playerId: string): string | undefined {
  return getPlayerById(playerId)?.profileId;
}
