import type { Profile } from "@/types";

/** Logged-in user for prototype — Zain (admin) */
export const CURRENT_USER_ID = "zain";

const managerStats = (
  rank: number,
  total: number,
  avg: number,
  best: number,
  bestGw: number,
  captainPts: number,
  captainRate: number,
  recent: number[],
  recentGws: number[]
) => ({
  managerRank: rank,
  totalFantasyPoints: total,
  averageGameweekPoints: avg,
  bestGameweek: best,
  bestGameweekNumber: bestGw,
  captainPointsTotal: captainPts,
  captainPickRate: captainRate,
  recentGameweekPoints: recent,
  recentGameweekNumbers: recentGws,
});

/**
 * Profiles exist only for fantasy managers (signed up via manager invite).
 * Roster-only players have no profile — admin creates them directly.
 */
export const mockProfiles: Profile[] = [
  {
    id: "zain",
    name: "Zain",
    initials: "ZA",
    avatarColor: "#84cc16",
    isAdmin: true,
    isFantasyManager: true,
    playerId: "zain",
    ...managerStats(2, 510, 63.8, 78, 3, 164, 50, [58, 64, 71, 68, 72], [4, 5, 6, 7, 8]),
  },
  {
    id: "ramis",
    name: "Ramis",
    initials: "RA",
    avatarColor: "#6366f1",
    isAdmin: false,
    isFantasyManager: true,
    playerId: "ramis",
    ...managerStats(1, 522, 65.3, 89, 5, 186, 62, [67, 72, 58, 81, 74], [4, 5, 6, 7, 8]),
  },
  {
    id: "osama",
    name: "Osama",
    initials: "OS",
    avatarColor: "#f97316",
    isAdmin: false,
    isFantasyManager: true,
    playerId: "osama",
    ...managerStats(3, 498, 62.3, 82, 6, 152, 38, [52, 58, 63, 55, 58], [4, 5, 6, 7, 8]),
  },
  {
    id: "jimmy",
    name: "Jimmy",
    initials: "JI",
    avatarColor: "#eab308",
    isAdmin: false,
    isFantasyManager: true,
    playerId: "jimmy",
    ...managerStats(4, 487, 60.9, 76, 4, 198, 75, [61, 55, 68, 59, 67], [4, 5, 6, 7, 8]),
  },
  {
    id: "shaafay",
    name: "Shaafay",
    initials: "SH",
    avatarColor: "#06b6d4",
    isAdmin: false,
    isFantasyManager: true,
    playerId: "shaafay",
    ...managerStats(5, 465, 58.1, 71, 2, 128, 25, [48, 52, 55, 60, 54], [4, 5, 6, 7, 8]),
  },
  {
    id: "ibtehaj",
    name: "Ibtehaj",
    initials: "IB",
    avatarColor: "#a855f7",
    isAdmin: false,
    isFantasyManager: true,
    playerId: "ibtehaj",
    ...managerStats(6, 441, 55.1, 69, 7, 112, 38, [44, 48, 50, 62, 47], [4, 5, 6, 7, 8]),
  },
  {
    id: "nikhil",
    name: "Nikhil",
    initials: "NI",
    avatarColor: "#ec4899",
    isAdmin: false,
    isFantasyManager: true,
    playerId: "nikhil",
    ...managerStats(7, 428, 53.5, 65, 5, 98, 12, [42, 46, 51, 48, 45], [4, 5, 6, 7, 8]),
  },
  {
    id: "shahrukh",
    name: "Shahrukh",
    initials: "SR",
    avatarColor: "#14b8a6",
    isAdmin: false,
    isFantasyManager: true,
    playerId: "shahrukh",
    ...managerStats(8, 412, 51.5, 63, 4, 86, 25, [38, 42, 45, 50, 44], [4, 5, 6, 7, 8]),
  },
  /** Manager-only — roster player optional; picks fantasy without playing */
  {
    id: "ahmed",
    name: "Ahmed",
    initials: "AH",
    avatarColor: "#3b82f6",
    isAdmin: false,
    isFantasyManager: true,
    ...managerStats(9, 398, 49.8, 61, 3, 74, 38, [40, 44, 46, 42, 41], [4, 5, 6, 7, 8]),
  },
  {
    id: "bilal",
    name: "Bilal",
    initials: "BI",
    avatarColor: "#8b5cf6",
    isAdmin: false,
    isFantasyManager: true,
    ...managerStats(10, 376, 47.0, 58, 6, 62, 25, [36, 38, 41, 39, 37], [4, 5, 6, 7, 8]),
  },
];

export function getCurrentUser(): Profile {
  return mockProfiles.find((p) => p.id === CURRENT_USER_ID)!;
}

export function getProfileById(id: string): Profile | undefined {
  return mockProfiles.find((p) => p.id === id);
}

export function getProfileByPlayerId(
  playerId: string
): Profile | undefined {
  return mockProfiles.find((p) => p.playerId === playerId);
}

export function getFantasyManagers(): Profile[] {
  return mockProfiles.filter((p) => p.isFantasyManager);
}

export function getPlayerOnlyProfiles(): Profile[] {
  return mockProfiles.filter((p) => p.playerId && !p.isFantasyManager);
}

export function getProfilesWithoutPlayer(): Profile[] {
  return mockProfiles.filter((p) => !p.playerId);
}
