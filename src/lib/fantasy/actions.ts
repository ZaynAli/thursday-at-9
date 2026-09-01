"use server";

import { revalidatePath } from "next/cache";
import { useMockData } from "@/lib/data/config";
import { persistFantasyTeam } from "@/lib/data/fantasy-teams";
import {
  FantasyAuthError,
  requireFantasyManager,
} from "@/lib/fantasy/require-manager";
import type { FantasySelection, FantasyTeam } from "@/types";

export type FantasyActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

function toResult<T>(fn: () => Promise<T>): Promise<FantasyActionResult<T>> {
  return fn()
    .then((data) => ({ ok: true as const, data }))
    .catch((err: unknown) => ({
      ok: false as const,
      error:
        err instanceof FantasyAuthError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Something went wrong.",
    }));
}

function revalidateFantasyPaths() {
  revalidatePath("/");
  revalidatePath("/fantasy");
  revalidatePath("/league");
  revalidatePath("/profile");
}

export async function saveFantasyTeamAction(
  gameweekId: string,
  selections: FantasySelection[],
  confirm = false
): Promise<FantasyActionResult<FantasyTeam>> {
  return toResult(async () => {
    if (useMockData()) {
      throw new Error("Connect Supabase to save fantasy teams.");
    }
    if (gameweekId === "draft") {
      throw new Error("No active gameweek to save to.");
    }

    const manager = await requireFantasyManager();
    const team = await persistFantasyTeam(
      gameweekId,
      manager.id,
      selections,
      confirm
    );
    revalidateFantasyPaths();
    return team;
  });
}
