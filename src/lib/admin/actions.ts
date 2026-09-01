"use server";

import { revalidatePath } from "next/cache";
import { useMockData } from "@/lib/data/config";
import { createManagerInvite } from "@/lib/data/invites.server";
import { insertPlayer, updatePlayer } from "@/lib/data/players.server";
import { enableFantasyManagerForPlayer } from "@/lib/data/profiles.server";
import { AdminAuthError, requireAdmin } from "@/lib/admin/require-admin";
import type { ManagerInvite, Player, Profile, SkillLevel } from "@/types";

export type AdminActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

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

function revalidatePlayerPaths(playerId?: string) {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/players");
  if (playerId) revalidatePath(`/admin/players/${playerId}`);
}

export async function createPlayerAction(
  name: string,
  skillLevel: SkillLevel
): Promise<AdminActionResult<Player>> {
  return toResult(async () => {
    if (useMockData()) throw new Error("Connect Supabase to persist roster changes.");
    await requireAdmin();
    const player = await insertPlayer(name, skillLevel);
    revalidatePlayerPaths(player.id);
    return player;
  });
}

export async function updatePlayerAction(
  playerId: string,
  updates: { skillLevel?: SkillLevel; isActive?: boolean }
): Promise<AdminActionResult<Player>> {
  return toResult(async () => {
    if (useMockData()) throw new Error("Connect Supabase to persist roster changes.");
    await requireAdmin();
    const player = await updatePlayer(playerId, updates);
    revalidatePlayerPaths(playerId);
    return player;
  });
}

export async function sendManagerInviteAction(
  playerId: string,
  playerName: string
): Promise<AdminActionResult<ManagerInvite>> {
  return toResult(async () => {
    if (useMockData()) throw new Error("Connect Supabase to persist invites.");
    const admin = await requireAdmin();
    const invite = await createManagerInvite(playerId, playerName, admin.id);
    revalidatePlayerPaths(playerId);
    return invite;
  });
}

export async function enableManagerAction(
  playerId: string
): Promise<AdminActionResult<Profile>> {
  return toResult(async () => {
    if (useMockData()) throw new Error("Connect Supabase to persist manager access.");
    await requireAdmin();
    const profile = await enableFantasyManagerForPlayer(playerId);
    revalidatePlayerPaths(playerId);
    return profile;
  });
}
