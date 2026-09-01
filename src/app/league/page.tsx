import { LeagueClient } from "@/components/league/LeagueClient";
import { getPlayerSeasonStats, getStandingsWithCurrentUser } from "@/lib/data";

export default async function LeaguePage() {
  const [standings, stats] = await Promise.all([
    getStandingsWithCurrentUser(),
    getPlayerSeasonStats(),
  ]);

  return <LeagueClient standings={standings} stats={stats} />;
}
