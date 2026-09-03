import { notFound } from "next/navigation";
import { ManagerDetailClient } from "@/components/league/ManagerDetailClient";
import {
  getProfileById,
  getCurrentGameweek,
  getFantasyTeamForManager,
  getStandingsWithCurrentUser,
  getRosterPlayers,
} from "@/lib/data";

interface Props {
  params: Promise<{ managerId: string }>;
}

export default async function ManagerDetailPage({ params }: Props) {
  const { managerId } = await params;
  const [profile, gameweek, standings, rosterPlayers] = await Promise.all([
    getProfileById(managerId),
    getCurrentGameweek(),
    getStandingsWithCurrentUser(),
    getRosterPlayers(),
  ]);

  if (!profile || !profile.isFantasyManager) {
    notFound();
  }

  const standing = standings.find((s) => s.managerId === managerId);
  const fantasyTeam =
    gameweek.id !== "draft"
      ? await getFantasyTeamForManager(gameweek.id, managerId)
      : null;

  return (
    <ManagerDetailClient
      profile={profile}
      standing={standing ?? null}
      gameweek={gameweek}
      fantasyTeam={fantasyTeam}
      rosterPlayers={rosterPlayers}
    />
  );
}
