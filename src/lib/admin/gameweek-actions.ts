"use server";

import { revalidatePath } from "next/cache";
import { useMockData } from "@/lib/data/config";
import {
  lockGameweekSelection,
  openGameweekSelection,
  saveGameweekSession,
  type GameweekSessionInput,
} from "@/lib/data/gameweeks.write.server";
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

function revalidateGameweekPaths() {
  revalidatePath("/");
  revalidatePath("/game");
  revalidatePath("/fantasy");
  revalidatePath("/admin");
  revalidatePath("/admin/gameweek");
}

export async function saveGameweekSessionAction(
  input: GameweekSessionInput
): Promise<AdminActionResult<Gameweek>> {
  return toResult(async () => {
    if (useMockData()) throw new Error("Connect Supabase to save gameweeks.");
    await requireAdmin();
    const gameweek = await saveGameweekSession(input);
    revalidateGameweekPaths();
    return gameweek;
  });
}

export async function openGameweekSelectionAction(
  input: GameweekSessionInput,
  recipientCount: number
): Promise<AdminActionResult<Gameweek>> {
  return toResult(async () => {
    if (useMockData()) throw new Error("Connect Supabase to open selection.");
    const admin = await requireAdmin();
    const gameweek = await openGameweekSelection(input, admin.id, recipientCount);
    revalidateGameweekPaths();
    return gameweek;
  });
}

export async function lockGameweekSelectionAction(
  gameweekId: string
): Promise<AdminActionResult<Gameweek>> {
  return toResult(async () => {
    if (useMockData()) throw new Error("Connect Supabase to lock selection.");
    await requireAdmin();
    const gameweek = await lockGameweekSelection(gameweekId);
    revalidateGameweekPaths();
    return gameweek;
  });
}
