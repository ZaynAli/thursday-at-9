import { GameHubClient, type GamePlayerStat } from "@/components/game/GameHubClient";
import { getMatchHubResultsSnapshot } from "@/lib/data";
import type { Gameweek } from "@/types";

export default async function GamePage() {
  const hub = await getMatchHubResultsSnapshot();

  let matchGameweek: Gameweek | null = hub?.gameweek ?? null;
  if (
    matchGameweek &&
    hub?.snapshot &&
    hub.snapshot.teamAScore != null &&
    hub.snapshot.teamBScore != null &&
    (matchGameweek.matchScores?.white == null ||
      matchGameweek.matchScores?.color == null)
  ) {
    matchGameweek = {
      ...matchGameweek,
      matchScores: {
        white: hub.snapshot.teamAScore,
        color: hub.snapshot.teamBScore,
      },
      teamWhiteName: hub.snapshot.teamAName,
      teamColorName: hub.snapshot.teamBName,
    };
  }

  const playerStats: GamePlayerStat[] =
    hub?.snapshot.playerStats.map((stat) => ({
      playerId: stat.playerId,
      goals: stat.goals,
      assists: stat.assists,
      defensiveStops: stat.defensiveStops,
      fantasyPoints: stat.fantasyPoints,
    })) ?? [];

  return (
    <GameHubClient
      matchGameweek={matchGameweek}
      initialPlayerStats={playerStats}
    />
  );
}
