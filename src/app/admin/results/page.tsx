import { AdminResultsClient } from "@/components/admin/AdminResultsClient";
import {
  getAvailablePlayers,
  getDataSource,
  getGameweekNeedingResults,
  getGameweekResultsSnapshot,
} from "@/lib/data";

export default async function AdminResultsPage() {
  const [gameweek, snapshot] = await Promise.all([
    getGameweekNeedingResults(),
    getGameweekResultsSnapshot(),
  ]);

  const sessionPlayers = gameweek
    ? await getAvailablePlayers(gameweek.availablePlayerIds)
    : [];

  return (
    <AdminResultsClient
      sessionPlayers={sessionPlayers}
      snapshot={snapshot}
      dataSource={getDataSource()}
    />
  );
}
