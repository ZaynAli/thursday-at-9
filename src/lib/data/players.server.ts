import {
  enrichPlayersWithJerseys,
  fetchJerseyIdByProfileId,
} from "@/lib/data/player-jerseys";
import { filterUuidIds } from "@/lib/data/utils";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapPlayerRow } from "@/lib/data/mappers/player";
import type { PlayerRow } from "@/lib/data/db-types";
import type { Player, SkillLevel } from "@/types";

function throwQueryError(action: string, message: string): never {
  if (message.includes("permission denied")) {
    throw new Error(
      `${action}: ${message}. Run supabase/grants-service-role.sql in the Supabase SQL Editor.`
    );
  }
  throw new Error(`${action}: ${message}`);
}

export async function fetchRosterPlayers(): Promise<Player[]> {
  const supabase = createAdminClient();
  const [jerseyByProfileId, playersResult] = await Promise.all([
    fetchJerseyIdByProfileId(),
    supabase
      .from("players")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true }),
  ]);

  const { data, error } = playersResult;
  if (error) throwQueryError("Failed to load players", error.message);
  const players = ((data ?? []) as PlayerRow[]).map(mapPlayerRow);
  return enrichPlayersWithJerseys(players, jerseyByProfileId);
}

/** All roster players for admin (includes inactive). */
export async function fetchAdminRosterPlayers(): Promise<Player[]> {
  const supabase = createAdminClient();
  const [jerseyByProfileId, playersResult] = await Promise.all([
    fetchJerseyIdByProfileId(),
    supabase.from("players").select("*").order("name", { ascending: true }),
  ]);

  const { data, error } = playersResult;
  if (error) throwQueryError("Failed to load players", error.message);
  const players = ((data ?? []) as PlayerRow[]).map(mapPlayerRow);
  return enrichPlayersWithJerseys(players, jerseyByProfileId);
}

export async function fetchPlayerById(id: string): Promise<Player | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Failed to load player: ${error.message}`);
  if (!data) return null;
  return mapPlayerRow(data as PlayerRow);
}

export async function fetchPlayerByName(name: string): Promise<Player | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .ilike("name", name)
    .maybeSingle();

  if (error) throw new Error(`Failed to load player: ${error.message}`);
  if (!data) return null;
  return mapPlayerRow(data as PlayerRow);
}

export async function fetchPlayersByIds(ids: string[]): Promise<Player[]> {
  const uuidIds = filterUuidIds(ids);
  if (uuidIds.length === 0) return [];

  const supabase = createAdminClient();
  const [jerseyByProfileId, playersResult] = await Promise.all([
    fetchJerseyIdByProfileId(),
    supabase.from("players").select("*").in("id", uuidIds),
  ]);

  const { data, error } = playersResult;
  if (error) throwQueryError("Failed to load players", error.message);
  const rows = (data ?? []) as PlayerRow[];
  const byId = new Map(
    enrichPlayersWithJerseys(rows.map(mapPlayerRow), jerseyByProfileId).map(
      (player) => [player.id, player]
    )
  );
  return uuidIds.map((id) => byId.get(id)).filter(Boolean) as Player[];
}

export async function insertPlayer(
  name: string,
  skillLevel: SkillLevel
): Promise<Player> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Player name is required.");

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("players")
    .insert({
      name: trimmed,
      skill_level: skillLevel,
      is_active: true,
    })
    .select("*")
    .single();

  if (error) throwQueryError("Failed to create player", error.message);
  return mapPlayerRow(data as PlayerRow);
}

export async function updatePlayer(
  id: string,
  updates: { skillLevel?: SkillLevel; isActive?: boolean }
): Promise<Player> {
  const payload: Record<string, unknown> = {};
  if (updates.skillLevel !== undefined) payload.skill_level = updates.skillLevel;
  if (updates.isActive !== undefined) payload.is_active = updates.isActive;

  if (Object.keys(payload).length === 0) {
    const existing = await fetchPlayerById(id);
    if (!existing) throw new Error("Player not found.");
    return existing;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("players")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throwQueryError("Failed to update player", error.message);
  return mapPlayerRow(data as PlayerRow);
}
