import { AdminManagerPicksClient } from "@/components/admin/AdminManagerPicksClient";
import { getCurrentGameweek, getDataSource } from "@/lib/data";
import { getManagerPicksSnapshot } from "@/lib/data/manager-picks";

export default async function AdminManagersPage() {
  const gameweek = await getCurrentGameweek();
  const snapshot =
    gameweek.id === "draft"
      ? null
      : await getManagerPicksSnapshot(
          gameweek.id,
          gameweek.number,
          gameweek.status
        );

  return (
    <AdminManagerPicksClient
      snapshot={snapshot}
      dataSource={getDataSource()}
    />
  );
}
