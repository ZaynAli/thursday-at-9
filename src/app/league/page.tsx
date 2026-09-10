import { LeagueClient } from "@/components/league/LeagueClient";
import {
  getCurrentUserId,
  getPlayerSeasonStats,
  getStandingsWithCurrentUser,
} from "@/lib/data";

export default async function LeaguePage() {
  const currentUserId = await getCurrentUserId();
  const [standings, stats] = await Promise.all([
    getStandingsWithCurrentUser(currentUserId),
    getPlayerSeasonStats(),
  ]);

  return <LeagueClient standings={standings} stats={stats} />;
}
