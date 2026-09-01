import { FANTASY_BUDGET, SQUAD_SIZE } from "@/lib/constants";
import type { FantasySelection, Player } from "@/types";

export function calculateSquadCost(players: Pick<Player, "price">[]): number {
  return players.reduce((sum, p) => sum + p.price, 0);
}

export function calculateBudgetRemaining(
  players: Pick<Player, "price">[]
): number {
  return FANTASY_BUDGET - calculateSquadCost(players);
}

export function canAffordPlayer(
  currentTeam: Pick<Player, "price">[],
  candidate: Pick<Player, "price">
): boolean {
  return calculateSquadCost([...currentTeam, candidate]) <= FANTASY_BUDGET;
}

export function getBudgetShortfall(
  currentTeam: Pick<Player, "price">[],
  candidate: Pick<Player, "price">
): number {
  const shortfall =
    calculateSquadCost([...currentTeam, candidate]) - FANTASY_BUDGET;
  return Math.max(0, shortfall);
}

export interface FantasyTeamValidation {
  isValid: boolean;
  errors: string[];
}

export function isFantasyTeamValid(
  selections: FantasySelection[],
  players: Player[]
): FantasyTeamValidation {
  const errors: string[] = [];
  const selectedPlayers = selections.map((s) =>
    players.find((p) => p.id === s.playerId)
  );

  if (selections.length !== SQUAD_SIZE) {
    errors.push(`Select exactly ${SQUAD_SIZE} players`);
  }

  const cost = calculateSquadCost(
    selectedPlayers.filter(Boolean) as Player[]
  );
  if (cost > FANTASY_BUDGET) {
    errors.push(`Budget exceeded by $${(cost - FANTASY_BUDGET).toFixed(1)}m`);
  }

  const captains = selections.filter((s) => s.isCaptain);
  if (captains.length !== 1 && selections.length > 0) {
    errors.push("Select exactly one Captain");
  }

  return { isValid: errors.length === 0, errors };
}

export function togglePlayerSelection(
  selections: FantasySelection[],
  playerId: string
): FantasySelection[] {
  const exists = selections.find((s) => s.playerId === playerId);
  if (exists) {
    return selections.filter((s) => s.playerId !== playerId);
  }
  if (selections.length >= SQUAD_SIZE) return selections;
  return [...selections, { playerId, isCaptain: false }];
}

export function setCaptain(
  selections: FantasySelection[],
  playerId: string
): FantasySelection[] {
  return selections.map((s) => ({
    ...s,
    isCaptain: s.playerId === playerId,
  }));
}
