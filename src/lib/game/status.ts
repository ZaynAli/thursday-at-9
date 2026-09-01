import type { GameweekStatus } from "@/types";

const STATUS_LABELS: Record<GameweekStatus, string> = {
  draft: "Setup in progress",
  pool_open: "Pool open",
  selection_open: "Lineups set",
  selection_locked: "Teams locked",
  in_progress: "Live",
  results_pending: "Awaiting publish",
  published: "Final",
};

const STATUS_VARIANT: Record<GameweekStatus, "default" | "secondary" | "outline"> = {
  draft: "outline",
  pool_open: "outline",
  selection_open: "secondary",
  selection_locked: "secondary",
  in_progress: "default",
  results_pending: "secondary",
  published: "default",
};

export function getGameStatusLabel(status: GameweekStatus): string {
  return STATUS_LABELS[status];
}

export function getGameStatusVariant(
  status: GameweekStatus
): "default" | "secondary" | "outline" {
  return STATUS_VARIANT[status];
}

export function isGameComplete(status: GameweekStatus): boolean {
  return status === "published" || status === "results_pending";
}

export function hasLineups(status: GameweekStatus): boolean {
  return !["draft", "pool_open"].includes(status);
}
