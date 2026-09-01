import { AdminResultsClient } from "@/components/admin/AdminResultsClient";
import {
  getAvailablePlayers,
  getCurrentGameweek,
  getDataSource,
  getGameweekResultsSnapshot,
} from "@/lib/data";

export default async function AdminResultsPage() {
  const [gameweek, snapshot] = await Promise.all([
    getCurrentGameweek(),
    getGameweekResultsSnapshot(),
  ]);

  const sessionPlayers = await getAvailablePlayers(gameweek.availablePlayerIds);

  return (
    <AdminResultsClient
      sessionPlayers={sessionPlayers}
      snapshot={snapshot}
      dataSource={getDataSource()}
    />
  );
}
