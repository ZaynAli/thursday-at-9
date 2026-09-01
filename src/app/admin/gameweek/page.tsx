import { AdminGameweekClient } from "@/components/admin/AdminGameweekClient";
import {
  getCurrentGameweek,
  getFantasyManagers,
  getRosterPlayers,
} from "@/lib/data";
import { getDataSource } from "@/lib/data/config";
import { fetchLatestGameweekNotification } from "@/lib/data/gameweeks.write.server";

export default async function AdminGameweekPage() {
  const [gameweek, rosterPlayers, managers] = await Promise.all([
    getCurrentGameweek(),
    getRosterPlayers(),
    getFantasyManagers(),
  ]);

  const lastNotification =
    gameweek.id !== "draft"
      ? await fetchLatestGameweekNotification(gameweek.id)
      : null;

  return (
    <AdminGameweekClient
      gameweek={gameweek}
      rosterPlayers={rosterPlayers}
      fantasyManagerCount={managers.length}
      dataSource={getDataSource()}
      lastNotification={lastNotification}
    />
  );
}
