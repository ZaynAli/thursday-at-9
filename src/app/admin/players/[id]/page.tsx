import { notFound } from "next/navigation";
import { AdminPlayerDetail } from "@/components/admin/AdminPlayerDetail";
import {
  getPendingInviteForPlayer,
  getPlayerById,
  getProfileByPlayerId,
} from "@/lib/data";
import { getDataSource } from "@/lib/data/config";

export default async function AdminPlayerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const player = await getPlayerById(id);
  if (!player) notFound();

  const [profile, pendingInvite] = await Promise.all([
    getProfileByPlayerId(player.id),
    getPendingInviteForPlayer(player.id, player.name),
  ]);

  return (
    <AdminPlayerDetail
      player={player}
      profile={profile ?? undefined}
      initialInvite={pendingInvite}
      dataSource={getDataSource()}
    />
  );
}
