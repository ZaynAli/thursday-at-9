import type { GameFormat } from "@/types";
import type { SessionTeam } from "@/lib/session-formats";
import { getPlayersPerSide } from "@/lib/session-formats";
import type { TeamFormation } from "@/types";

export type { TeamFormation };

export type FormationRole = "DEF" | "MID" | "FWD";

export interface FormationSlot {
  index: number;
  role: FormationRole;
  x: number;
  y: number;
}

interface FormationShape {
  label: string;
  rows: number[];
}

/** Outfield rows per side — DEF → MID → FWD (toward halfway line) */
const FORMATION_BY_COUNT: Record<number, FormationShape> = {
  5: { label: "1-2-2", rows: [1, 2, 2] },
  6: { label: "2-2-2", rows: [2, 2, 2] },
  7: { label: "2-3-2", rows: [2, 3, 2] },
  8: { label: "3-3-2", rows: [3, 3, 2] },
  9: { label: "3-3-3", rows: [3, 3, 3] },
};

const ROW_ROLES: FormationRole[] = ["DEF", "MID", "FWD"];

const WHITE_Y: Record<FormationRole, number> = {
  DEF: 78,
  MID: 66,
  FWD: 54,
};

const COLOR_Y: Record<FormationRole, number> = {
  DEF: 22,
  MID: 34,
  FWD: 46,
};

function rowXPositions(count: number): number[] {
  if (count <= 0) return [];
  if (count === 1) return [50];
  if (count === 2) return [40, 60];
  if (count === 3) return [30, 50, 70];
  if (count === 4) return [22, 40, 60, 78];
  return Array.from({ length: count }, (_, i) => 15 + ((i + 1) / (count + 1)) * 70);
}

function getFormationShape(count: number): FormationShape {
  return (
    FORMATION_BY_COUNT[count] ?? {
      label: `${count}-a-side`,
      rows: distributePlayersAcrossRows(count),
    }
  );
}

function distributePlayersAcrossRows(count: number): number[] {
  const rowCount = Math.min(3, Math.max(2, Math.ceil(count / 3)));
  const base = Math.floor(count / rowCount);
  const remainder = count % rowCount;
  return Array.from({ length: rowCount }, (_, i) => base + (i < remainder ? 1 : 0));
}

export function getFormationLabel(format: GameFormat): string {
  return getFormationShape(getPlayersPerSide(format)).label;
}

export function getFormationSlots(team: SessionTeam, format: GameFormat): FormationSlot[] {
  const count = getPlayersPerSide(format);
  const shape = getFormationShape(count);
  const yMap = team === "white" ? WHITE_Y : COLOR_Y;
  const slots: FormationSlot[] = [];
  let index = 0;

  shape.rows.forEach((playersInRow, rowIndex) => {
    const role = ROW_ROLES[Math.min(rowIndex, ROW_ROLES.length - 1)] ?? "MID";
    const xs = rowXPositions(playersInRow);

    xs.forEach((x) => {
      slots.push({
        index,
        role,
        x,
        y: yMap[role],
      });
      index += 1;
    });
  });

  return slots;
}

export function createEmptyFormation(format: GameFormat): TeamFormation {
  const size = getPlayersPerSide(format);
  return {
    white: Array.from({ length: size }, () => null),
    color: Array.from({ length: size }, () => null),
  };
}

export function buildDefaultFormation(
  teamAssignments: Record<string, SessionTeam>,
  format: GameFormat
): TeamFormation {
  const formation = createEmptyFormation(format);
  const size = getPlayersPerSide(format);

  const whiteIds = Object.entries(teamAssignments)
    .filter(([, team]) => team === "white")
    .map(([id]) => id)
    .sort();
  const colorIds = Object.entries(teamAssignments)
    .filter(([, team]) => team === "color")
    .map(([id]) => id)
    .sort();

  whiteIds.slice(0, size).forEach((id, index) => {
    formation.white[index] = id;
  });
  colorIds.slice(0, size).forEach((id, index) => {
    formation.color[index] = id;
  });

  return formation;
}

/**
 * Keep existing pitch slots for players still on the same team, then place
 * newcomers (or team-switchers) into empty slots. Used when the session roster
 * changes so a dropout's slot gets filled by the replacement.
 */
export function reconcileFormation(
  existing: TeamFormation | null | undefined,
  teamAssignments: Record<string, SessionTeam>,
  format: GameFormat
): TeamFormation {
  const size = getPlayersPerSide(format);
  const next = createEmptyFormation(format);

  if (existing) {
    for (const team of ["white", "color"] as const) {
      const row = existing[team] ?? [];
      for (let i = 0; i < size; i++) {
        const playerId = row[i];
        if (playerId && teamAssignments[playerId] === team) {
          next[team][i] = playerId;
        }
      }
    }
  }

  const placed = new Set(
    [...next.white, ...next.color].filter((id): id is string => Boolean(id))
  );

  const unplacedByTeam: Record<SessionTeam, string[]> = { white: [], color: [] };
  for (const [playerId, team] of Object.entries(teamAssignments)) {
    if (team !== "white" && team !== "color") continue;
    if (placed.has(playerId)) continue;
    unplacedByTeam[team].push(playerId);
  }

  for (const team of ["white", "color"] as const) {
    const row = next[team];
    for (const playerId of unplacedByTeam[team]) {
      const emptyIndex = row.findIndex((id) => id == null);
      if (emptyIndex < 0) break;
      row[emptyIndex] = playerId;
    }
  }

  return next;
}

export function formationFromSlotMap(
  slotMap: Record<string, { team: SessionTeam; slot: number }>,
  format: GameFormat
): TeamFormation {
  const formation = createEmptyFormation(format);
  for (const [playerId, { team, slot }] of Object.entries(slotMap)) {
    const row = team === "white" ? formation.white : formation.color;
    if (slot >= 0 && slot < row.length) {
      row[slot] = playerId;
    }
  }
  return formation;
}

export function formationToSlotMap(
  formation: TeamFormation
): Record<string, { team: SessionTeam; slot: number }> {
  const map: Record<string, { team: SessionTeam; slot: number }> = {};
  formation.white.forEach((playerId, slot) => {
    if (playerId) map[playerId] = { team: "white", slot };
  });
  formation.color.forEach((playerId, slot) => {
    if (playerId) map[playerId] = { team: "color", slot };
  });
  return map;
}

export function swapFormationSlots(
  formation: TeamFormation,
  from: { team: SessionTeam; slot: number },
  to: { team: SessionTeam; slot: number }
): TeamFormation {
  const next: TeamFormation = {
    white: [...formation.white],
    color: [...formation.color],
  };

  const fromRow = from.team === "white" ? next.white : next.color;
  const toRow = to.team === "white" ? next.white : next.color;
  const temp = fromRow[from.slot] ?? null;
  fromRow[from.slot] = toRow[to.slot] ?? null;
  toRow[to.slot] = temp;

  return next;
}
