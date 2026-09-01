import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildManagerInviteUrl } from "@/lib/onboarding";
import type { InviteRow } from "@/lib/data/db-types";
import type { ManagerInvite } from "@/types";

function mapInviteRow(row: InviteRow, playerName: string): ManagerInvite {
  return {
    id: row.id,
    playerId: row.player_id,
    playerName,
    status: row.status,
    token: row.token,
    inviteUrl: buildManagerInviteUrl(row.token),
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    acceptedAt: row.accepted_at ?? undefined,
  };
}

export async function fetchPendingInviteForPlayer(
  playerId: string,
  playerName: string
): Promise<ManagerInvite | undefined> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("invites")
    .select("*")
    .eq("player_id", playerId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Failed to load invite: ${error.message}`);
  if (!data) return undefined;
  return mapInviteRow(data as InviteRow, playerName);
}

export async function fetchPendingInvitesByPlayerIds(
  playerIds: string[],
  playerNames: Map<string, string>
): Promise<Map<string, ManagerInvite>> {
  if (playerIds.length === 0) return new Map();

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("invites")
    .select("*")
    .in("player_id", playerIds)
    .eq("status", "pending");

  if (error) throw new Error(`Failed to load invites: ${error.message}`);

  const map = new Map<string, ManagerInvite>();
  ((data ?? []) as InviteRow[]).forEach((row) => {
    const name = playerNames.get(row.player_id) ?? "Player";
    map.set(row.player_id, mapInviteRow(row, name));
  });
  return map;
}

export async function fetchInviteByToken(token: string): Promise<{
  invite: InviteRow;
  playerName: string;
} | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("invites")
    .select("*, players(name)")
    .eq("token", token)
    .maybeSingle();

  if (error) throw new Error(`Failed to load invite: ${error.message}`);
  if (!data) return null;

  const row = data as InviteRow & { players: { name: string } | null };
  return {
    invite: row,
    playerName: row.players?.name ?? "Player",
  };
}

export async function fetchPendingInvites(): Promise<ManagerInvite[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("invites")
    .select("*, players(name)")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to load invites: ${error.message}`);

  return ((data ?? []) as (InviteRow & { players: { name: string } | null })[]).map(
    (row) => mapInviteRow(row, row.players?.name ?? "Player")
  );
}

const INVITE_TTL_MS = 30 * 86400000;

export async function createManagerInvite(
  playerId: string,
  playerName: string,
  createdBy?: string
): Promise<ManagerInvite> {
  const supabase = createAdminClient();

  const { error: expireError } = await supabase
    .from("invites")
    .update({ status: "expired" })
    .eq("player_id", playerId)
    .eq("status", "pending");

  if (expireError) {
    throw new Error(`Failed to expire old invites: ${expireError.message}`);
  }

  const token = randomUUID();
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS).toISOString();

  const { data, error } = await supabase
    .from("invites")
    .insert({
      player_id: playerId,
      token,
      expires_at: expiresAt,
      created_by: createdBy ?? null,
    })
    .select("*")
    .single();

  if (error) throw new Error(`Failed to create invite: ${error.message}`);
  return mapInviteRow(data as InviteRow, playerName);
}
