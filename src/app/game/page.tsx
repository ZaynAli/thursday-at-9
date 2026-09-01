import { GameHubClient, type GamePlayerStat } from "@/components/game/GameHubClient";
import { getGameweekResultsSnapshot } from "@/lib/data";

export default async function GamePage() {
  const snapshot = await getGameweekResultsSnapshot();

  const playerStats: GamePlayerStat[] =
    snapshot?.playerStats.map((stat) => ({
      playerId: stat.playerId,
      goals: stat.goals,
      assists: stat.assists,
      defensiveStops: stat.defensiveStops,
    })) ?? [];

  return <GameHubClient initialPlayerStats={playerStats} />;
}
