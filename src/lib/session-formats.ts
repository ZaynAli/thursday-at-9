export type GameFormat = "5v5" | "6v6" | "7v7" | "8v8" | "9v9";

/** Internal side key — maps to DB `team_side` `'a'` | `'b'` on migration */
export type SessionTeam = "white" | "color";

export interface GameFormatConfig {
  id: GameFormat;
  label: string;
  playersPerSide: number;
  totalPlayers: number;
  description: string;
}

export const GAME_FORMATS: GameFormatConfig[] = [
  {
    id: "5v5",
    label: "5v5",
    playersPerSide: 5,
    totalPlayers: 10,
    description: "5 per side · 10 total",
  },
  {
    id: "6v6",
    label: "6v6",
    playersPerSide: 6,
    totalPlayers: 12,
    description: "6 per side · 12 total",
  },
  {
    id: "7v7",
    label: "7v7",
    playersPerSide: 7,
    totalPlayers: 14,
    description: "7 per side · 14 total",
  },
  {
    id: "8v8",
    label: "8v8",
    playersPerSide: 8,
    totalPlayers: 16,
    description: "8 per side · 16 total",
  },
  {
    id: "9v9",
    label: "9v9",
    playersPerSide: 9,
    totalPlayers: 18,
    description: "9 per side · 18 total",
  },
];

export const DEFAULT_GAME_FORMAT: GameFormat = "7v7";

export function getFormatConfig(format: GameFormat): GameFormatConfig {
  return GAME_FORMATS.find((f) => f.id === format)!;
}

export function getMaxSessionPlayers(format: GameFormat): number {
  return getFormatConfig(format).totalPlayers;
}

export function getPlayersPerSide(format: GameFormat): number {
  return getFormatConfig(format).playersPerSide;
}

export const DEFAULT_TEAM_NAMES = {
  white: "White",
  color: "Colours",
} as const;

/** Common presets for the weekly session admin page */
export const TEAM_NAME_PRESETS = [
  {
    id: "white-colours",
    label: "White vs Colours",
    teamA: "White",
    teamB: "Colours",
  },
  {
    id: "black-colours",
    label: "Black vs Colours",
    teamA: "Black",
    teamB: "Colours",
  },
] as const;

/** Map prototype side keys to neutral DB sides */
export const SESSION_TEAM_TO_DB_SIDE = {
  white: "a",
  color: "b",
} as const;

export type TeamAssignments = Record<string, SessionTeam | null>;

export function countTeamAssignments(
  assignments: TeamAssignments,
  team: SessionTeam
): number {
  return Object.values(assignments).filter((t) => t === team).length;
}

export function getUnassignedPlayerIds(
  selectedIds: string[],
  assignments: TeamAssignments
): string[] {
  return selectedIds.filter((id) => !assignments[id]);
}

export function isTeamSetupComplete(
  selectedIds: string[],
  assignments: TeamAssignments,
  format: GameFormat
): { complete: boolean; issues: string[] } {
  const issues: string[] = [];
  const config = getFormatConfig(format);
  const unassigned = getUnassignedPlayerIds(selectedIds, assignments);

  if (selectedIds.length === 0) {
    issues.push("Select session players");
  }
  if (selectedIds.length !== config.totalPlayers) {
    issues.push(
      `Select exactly ${config.totalPlayers} players for ${format}`
    );
  }
  if (unassigned.length > 0) {
    issues.push(`${unassigned.length} player(s) not assigned to a team`);
  }

  const white = countTeamAssignments(assignments, "white");
  const color = countTeamAssignments(assignments, "color");
  if (white !== config.playersPerSide || color !== config.playersPerSide) {
    issues.push(
      `Teams should be ${config.playersPerSide} vs ${config.playersPerSide} (currently ${white} vs ${color})`
    );
  }

  return { complete: issues.length === 0, issues };
}
