import { createAdminClient } from "@/lib/supabase/admin";
import type { InviteRow, PlayerRow } from "@/lib/data/db-types";

export class InviteAcceptError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InviteAcceptError";
  }
}

function playerInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/** Link an authenticated profile to a roster player via manager invite token. */
export async function acceptManagerInvite(
  token: string,
  profileId: string
): Promise<void> {
  const supabase = createAdminClient();

  const { data: inviteRow, error: inviteError } = await supabase
    .from("invites")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (inviteError) {
    throw new InviteAcceptError(`Could not load invite: ${inviteError.message}`);
  }
  if (!inviteRow) {
    throw new InviteAcceptError("Invite not found.");
  }

  const invite = inviteRow as InviteRow;
  if (invite.status !== "pending") {
    throw new InviteAcceptError("This invite has already been used or expired.");
  }
  if (new Date(invite.expires_at) <= new Date()) {
    throw new InviteAcceptError("This invite has expired.");
  }

  const { data: playerRow, error: playerError } = await supabase
    .from("players")
    .select("*")
    .eq("id", invite.player_id)
    .maybeSingle();

  if (playerError || !playerRow) {
    throw new InviteAcceptError("Linked player not found.");
  }

  const player = playerRow as PlayerRow;
  if (player.profile_id && player.profile_id !== profileId) {
    throw new InviteAcceptError("This player already has a linked profile.");
  }

  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("player_id, is_fantasy_manager")
    .eq("id", profileId)
    .maybeSingle();

  if (profileError || !profileRow) {
    throw new InviteAcceptError("Profile not found.");
  }
  if (profileRow.player_id && profileRow.player_id !== invite.player_id) {
    throw new InviteAcceptError("Your profile is already linked to another player.");
  }

  const now = new Date().toISOString();
  const initials = playerInitials(player.name);

  const { error: updateProfileError } = await supabase
    .from("profiles")
    .update({
      player_id: invite.player_id,
      is_fantasy_manager: true,
      display_name: player.name,
      initials,
    })
    .eq("id", profileId);

  if (updateProfileError) {
    throw new InviteAcceptError(`Could not update profile: ${updateProfileError.message}`);
  }

  const { error: updatePlayerError } = await supabase
    .from("players")
    .update({ profile_id: profileId })
    .eq("id", invite.player_id);

  if (updatePlayerError) {
    throw new InviteAcceptError(`Could not link player: ${updatePlayerError.message}`);
  }

  const { error: updateInviteError } = await supabase
    .from("invites")
    .update({
      status: "accepted",
      accepted_at: now,
      accepted_profile_id: profileId,
    })
    .eq("id", invite.id);

  if (updateInviteError) {
    throw new InviteAcceptError(`Could not mark invite accepted: ${updateInviteError.message}`);
  }
}
