import { LeagueClient } from "@/components/league/LeagueClient";
import { getPlayerSeasonStats } from "@/lib/data";

export default async function LeaguePage() {
  const stats = await getPlayerSeasonStats();

  return <LeagueClient stats={stats} />;
}
