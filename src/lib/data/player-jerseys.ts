import { DEFAULT_JERSEY_ID, resolveJerseyId, type JerseyId } from "@/lib/jerseys";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Player } from "@/types";

export async function fetchJerseyIdByProfileId(): Promise<Map<string, JerseyId>> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("profiles").select("id, jersey_id");

  if (error) {
    throw new Error(`Failed to load profile jerseys: ${error.message}`);
  }

  const map = new Map<string, JerseyId>();
  (data ?? []).forEach((row) => {
    map.set(row.id as string, resolveJerseyId(row.jersey_id as string | null));
  });
  return map;
}

export function jerseyIdForPlayer(
  player: Player,
  jerseyByProfileId: Map<string, JerseyId>
): JerseyId {
  if (!player.profileId) return DEFAULT_JERSEY_ID;
  return jerseyByProfileId.get(player.profileId) ?? DEFAULT_JERSEY_ID;
}

export function enrichPlayersWithJerseys(
  players: Player[],
  jerseyByProfileId: Map<string, JerseyId>
): Player[] {
  return players.map((player) => ({
    ...player,
    jerseyId: jerseyIdForPlayer(player, jerseyByProfileId),
  }));
}
