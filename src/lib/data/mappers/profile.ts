import type { ProfileRow } from "@/lib/data/db-types";
import type { Profile } from "@/types";
import { resolveJerseyId } from "@/lib/jerseys";

const DEFAULT_AVATAR = "#84cc16";

export function mapProfileRow(row: ProfileRow): Profile {
  return {
    id: row.id,
    name: row.display_name,
    initials: row.initials ?? row.display_name.slice(0, 2).toUpperCase(),
    avatarColor: row.avatar_color ?? DEFAULT_AVATAR,
    isAdmin: row.is_admin,
    isFantasyManager: row.is_fantasy_manager,
    playerId: row.player_id ?? undefined,
    jerseyId: resolveJerseyId(row.jersey_id),
  };
}
