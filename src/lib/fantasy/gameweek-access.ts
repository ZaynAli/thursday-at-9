import type { Gameweek } from "@/types";

const LOCKED_STATUSES = new Set([
  "selection_locked",
  "in_progress",
  "results_pending",
  "published",
]);

/** Managers can edit picks while selection is open and before the deadline. */
export function isFantasySelectionEditable(gameweek: Gameweek): boolean {
  if (gameweek.id === "draft") return false;
  if (gameweek.status !== "selection_open") return false;
  return new Date(gameweek.fantasyDeadline).getTime() > Date.now();
}

/** Other managers' submitted teams are visible after admin locks selection. */
export function canViewOtherFantasyTeams(gameweek: Gameweek): boolean {
  if (gameweek.id === "draft") return false;
  return LOCKED_STATUSES.has(gameweek.status);
}

export function getFantasyLockReason(gameweek: Gameweek): string | null {
  if (gameweek.id === "draft") {
    return "The admin hasn't opened this gameweek yet.";
  }
  if (gameweek.status === "draft" || gameweek.status === "pool_open") {
    return "Selection isn't open yet — check back after the admin opens picks.";
  }
  if (LOCKED_STATUSES.has(gameweek.status)) {
    return "Selection is locked for this gameweek.";
  }
  if (new Date(gameweek.fantasyDeadline).getTime() <= Date.now()) {
    return "The fantasy deadline has passed.";
  }
  return null;
}
