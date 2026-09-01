"use server";

import { revalidatePath } from "next/cache";
import { useMockData } from "@/lib/data/config";
import { updateMatchFormation } from "@/lib/data/gameweeks.write.server";
import { requireAdmin, AdminAuthError } from "@/lib/admin/require-admin";
import type { TeamFormation } from "@/types";
import type { Gameweek } from "@/types";
import type { AdminActionResult } from "@/lib/admin/actions";

function toResult<T>(fn: () => Promise<T>): Promise<AdminActionResult<T>> {
  return fn()
    .then((data) => ({ ok: true as const, data }))
    .catch((err: unknown) => ({
      ok: false as const,
      error:
        err instanceof AdminAuthError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Something went wrong.",
    }));
}

function revalidateGamePaths() {
  revalidatePath("/game");
  revalidatePath("/");
  revalidatePath("/admin/gameweek");
}

export async function updateMatchFormationAction(
  gameweekId: string,
  formation: TeamFormation
): Promise<AdminActionResult<Gameweek>> {
  return toResult(async () => {
    if (useMockData()) throw new Error("Connect Supabase to save formation.");
    await requireAdmin();
    const gameweek = await updateMatchFormation(gameweekId, formation);
    revalidateGamePaths();
    return gameweek;
  });
}
