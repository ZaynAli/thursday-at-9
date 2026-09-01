import {
  getAdminRosterPlayers,
  getPendingInvitesByPlayerIds,
  getProfilesByPlayerIds,
} from "@/lib/data";
import { getDataSource } from "@/lib/data/config";
import { AdminPlayersList } from "@/components/admin/AdminPlayersList";

export default async function AdminPlayersPage() {
  const roster = await getAdminRosterPlayers();
  const playerIds = roster.map((player) => player.id);
  const playerNames = new Map(roster.map((player) => [player.id, player.name]));

  const [profiles, invites] = await Promise.all([
    getProfilesByPlayerIds(playerIds),
    getPendingInvitesByPlayerIds(playerIds, playerNames),
  ]);

  const initialPlayers = roster.map((player) => ({
    player,
    profile: profiles.get(player.id),
    pendingInvite: invites.get(player.id),
  }));

  return (
    <AdminPlayersList
      initialPlayers={initialPlayers}
      dataSource={getDataSource()}
    />
  );
}
