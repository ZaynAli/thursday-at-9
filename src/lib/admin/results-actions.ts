"use server";

import { revalidatePath } from "next/cache";
import { useMockData } from "@/lib/data/config";
import {
  persistGameweekResults,
  publishGameweekResults,
  type GameweekResultsInput,
} from "@/lib/data/results";
import { requireAdmin, AdminAuthError } from "@/lib/admin/require-admin";
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

function revalidateResultsPaths() {
  revalidatePath("/game");
  revalidatePath("/");
  revalidatePath("/fantasy");
  revalidatePath("/league");
  revalidatePath("/profile");
  revalidatePath("/admin");
  revalidatePath("/admin/results");
}

export async function saveGameweekResultsAction(
  input: GameweekResultsInput
): Promise<AdminActionResult<Gameweek>> {
  return toResult(async () => {
    if (useMockData()) throw new Error("Connect Supabase to save results.");
    await requireAdmin();
    const gameweek = await persistGameweekResults(input);
    revalidateResultsPaths();
    return gameweek;
  });
}

export async function publishGameweekAction(
  gameweekId: string
): Promise<AdminActionResult<Gameweek>> {
  return toResult(async () => {
    if (useMockData()) throw new Error("Connect Supabase to publish gameweeks.");
    await requireAdmin();
    const gameweek = await publishGameweekResults(gameweekId);
    revalidateResultsPaths();
    return gameweek;
  });
}
