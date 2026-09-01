"use client";

import Link from "next/link";
import { GameweekHeader } from "@/components/home/GameweekHeader";
import { StatCard } from "@/components/shared/StatCard";
import { TeamPreview } from "@/components/home/TeamPreview";
import { LeaguePreview } from "@/components/home/LeaguePreview";
import { LatestGameweek } from "@/components/home/LatestGameweek";
import { buttonVariants } from "@/components/ui/button";
import { useAppSession, useCurrentUser, usePlayerLookup } from "@/context/AppSessionContext";
import { useFantasyTeamContext } from "@/context/FantasyTeamContext";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const { gameweek, standings, latestRecap } = useAppSession();
  const user = useCurrentUser();
  const playerLookup = usePlayerLookup();
  const { selectedPlayers, captainId, hydrated } = useFantasyTeamContext();

  const userStanding = user
    ? standings.find((standing) => standing.managerId === user.id)
    : undefined;
  const currentGwPoints = userStanding?.currentGameweekPoints ?? 0;
  const managerRank = userStanding?.rank ?? user?.managerRank;
  const seasonPoints = userStanding?.seasonPoints ?? user?.totalFantasyPoints;
  const player = user?.playerId ? playerLookup.get(user.playerId) : undefined;
  const isManager = user?.isFantasyManager ?? false;
  const recap = latestRecap;

  return (
    <div className="space-y-6 lg:space-y-8 animate-slide-up">
      <GameweekHeader gameweekNumber={gameweek.number} />

      {!user && (
        <section className="rounded-lg border border-border bg-surface p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Sign in to pick teams and track your season</p>
            <p className="text-xs text-text-muted mt-0.5">
              Roster-only players don&apos;t need an account.
            </p>
          </div>
          <Link
            href="/login"
            className={cn(
              buttonVariants(),
              "bg-lime text-background hover:bg-lime-muted shrink-0"
            )}
          >
            Sign in
          </Link>
        </section>
      )}

      {isManager && user && (
        <section>
          <h2 className="text-xs font-semibold tracking-[0.15em] text-text-muted uppercase mb-3">
            Your Season
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              label="Rank"
              value={`#${managerRank ?? "—"}`}
              highlight
            />
            <StatCard
              label="Total Pts"
              value={seasonPoints ?? 0}
            />
            <StatCard
              label="This GW"
              value={currentGwPoints}
            />
          </div>
        </section>
      )}

      {!isManager && player && (
        <section>
          <h2 className="text-xs font-semibold tracking-[0.15em] text-text-muted uppercase mb-3">
            Your Player Stats
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Apps" value={player.appearances} />
            <StatCard label="Goals" value={player.goals} highlight />
            <StatCard label="Season Pts" value={player.seasonFantasyPoints} />
          </div>
        </section>
      )}

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {isManager && hydrated && (
            <TeamPreview players={selectedPlayers} captainId={captainId} />
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          {isManager && user && managerRank != null && (
            <LeaguePreview
              standings={standings}
              currentUserRank={managerRank}
            />
          )}
          {recap && <LatestGameweek recap={recap} />}
        </div>
      </div>
    </div>
  );
}
