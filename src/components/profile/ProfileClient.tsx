"use client";

import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { JerseyPicker } from "@/components/profile/JerseyPicker";
import { RecentForm } from "@/components/profile/RecentForm";
import { StatCard } from "@/components/shared/StatCard";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { useCurrentUser, usePlayerLookup } from "@/context/AppSessionContext";

export function ProfileClient() {
  const profile = useCurrentUser();
  const playerLookup = usePlayerLookup();

  if (!profile) return null;

  const player = profile.playerId ? playerLookup.get(profile.playerId) : undefined;

  return (
    <div className="space-y-8 animate-slide-up max-w-2xl">
      <div className="flex items-start justify-between gap-4">
        <ProfileHeader profile={profile} linkedPlayer={player} />
        <SignOutButton />
      </div>

      {profile.isFantasyManager && (
        <JerseyPicker currentJerseyId={profile.jerseyId} />
      )}

      {player && (
        <section>
          <h2 className="text-xs font-semibold tracking-[0.15em] text-text-muted uppercase mb-3">
            Player Performance
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            <StatCard label="Apps" value={player.appearances} />
            <StatCard label="Goals" value={player.goals} highlight />
            <StatCard label="Assists" value={player.assists} />
            <StatCard label="Stops" value={player.defensiveStops} />
            <StatCard label="Wins" value={player.wins} />
            <StatCard
              label="Fantasy Pts"
              value={player.seasonFantasyPoints}
              highlight
            />
          </div>
        </section>
      )}

      {profile.isFantasyManager && profile.managerRank != null && (
        <section>
          <h2 className="text-xs font-semibold tracking-[0.15em] text-text-muted uppercase mb-3">
            Manager Performance
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              label="League Rank"
              value={`#${profile.managerRank}`}
              highlight
            />
            <StatCard
              label="Total Pts"
              value={profile.totalFantasyPoints ?? 0}
            />
            <StatCard
              label="Avg GW"
              value={profile.averageGameweekPoints?.toFixed(1) ?? "—"}
            />
            <StatCard
              label="Best GW"
              value={profile.bestGameweek ?? 0}
              subtext={
                profile.bestGameweekNumber
                  ? `Gameweek ${profile.bestGameweekNumber}`
                  : undefined
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <StatCard
              label="Captain Pts"
              value={profile.captainPointsTotal ?? 0}
            />
            <StatCard
              label="Captain Rate"
              value={`${profile.captainPickRate ?? 0}%`}
            />
          </div>
        </section>
      )}

      {profile.isFantasyManager && profile.recentGameweekPoints && (
        <RecentForm profile={profile} />
      )}
    </div>
  );
}
