import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { mapProfileRow } from "@/lib/data/mappers/profile";
import type { ProfileRow } from "@/lib/data/db-types";
import type { Profile } from "@/types";

export async function fetchProfileById(id: string): Promise<Profile | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Failed to load profile: ${error.message}`);
  if (!data) return null;
  return mapProfileRow(data as ProfileRow);
}

export async function fetchProfileByPlayerId(
  playerId: string
): Promise<Profile | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("player_id", playerId)
    .maybeSingle();

  if (error) throw new Error(`Failed to load profile: ${error.message}`);
  if (!data) return null;
  return mapProfileRow(data as ProfileRow);
}

export async function fetchFantasyManagers(): Promise<Profile[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("is_fantasy_manager", true)
    .order("display_name", { ascending: true });

  if (error) throw new Error(`Failed to load managers: ${error.message}`);
  return ((data ?? []) as ProfileRow[]).map(mapProfileRow);
}

export async function fetchProfilesByPlayerIds(
  playerIds: string[]
): Promise<Map<string, Profile>> {
  if (playerIds.length === 0) return new Map();

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .in("player_id", playerIds);

  if (error) throw new Error(`Failed to load profiles: ${error.message}`);

  const map = new Map<string, Profile>();
  ((data ?? []) as ProfileRow[]).forEach((row) => {
    if (row.player_id) map.set(row.player_id, mapProfileRow(row));
  });
  return map;
}

async function ensureProfileForAuthUser(user: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}): Promise<Profile> {
  const displayName =
    (typeof user.user_metadata?.display_name === "string"
      ? user.user_metadata.display_name
      : null) ??
    user.email?.split("@")[0] ??
    "Manager";
  const initials = displayName.slice(0, 2).toUpperCase();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .upsert(
      {
        id: user.id,
        display_name: displayName,
        initials,
      },
      { onConflict: "id" }
    )
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to bootstrap profile: ${error.message}`);
  }

  return mapProfileRow(data as ProfileRow);
}

export async function fetchAuthProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const profile = await fetchProfileById(user.id);
  const resolved =
    profile ?? (await ensureProfileForAuthUser(user));

  return user.email ? { ...resolved, email: user.email } : resolved;
}

export async function enableFantasyManagerForPlayer(playerId: string): Promise<Profile> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("player_id", playerId)
    .maybeSingle();

  if (error) throw new Error(`Failed to load profile: ${error.message}`);
  if (!data) {
    throw new Error("This player has not signed up yet — send a manager invite first.");
  }

  const row = data as ProfileRow;
  if (row.is_fantasy_manager) {
    return mapProfileRow(row);
  }

  const { data: updated, error: updateError } = await supabase
    .from("profiles")
    .update({ is_fantasy_manager: true })
    .eq("id", row.id)
    .select("*")
    .single();

  if (updateError) {
    throw new Error(`Failed to enable fantasy manager: ${updateError.message}`);
  }

  return mapProfileRow(updated as ProfileRow);
}
