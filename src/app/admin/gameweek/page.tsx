import { AdminGameweekClient } from "@/components/admin/AdminGameweekClient";
import {
  getAdminSetupGameweek,
  getFantasyManagers,
  getRosterPlayers,
} from "@/lib/data";
import { getDataSource } from "@/lib/data/config";
import { fetchNextGameweekNumber } from "@/lib/data/gameweeks.server";
import { fetchLatestGameweekNotification } from "@/lib/data/gameweeks.write.server";

export default async function AdminGameweekPage() {
  const dataSource = getDataSource();
  const [gameweek, rosterPlayers, managers, nextGameweekNumber] =
    await Promise.all([
      getAdminSetupGameweek(),
      getRosterPlayers(),
      getFantasyManagers(),
      dataSource === "mock" ? Promise.resolve(2) : fetchNextGameweekNumber(),
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
      dataSource={dataSource}
      lastNotification={lastNotification}
      nextGameweekNumber={nextGameweekNumber}
    />
  );
}
