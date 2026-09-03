"use client";

import Link from "next/link";
import { ArrowLeft, Trophy, Star, Calendar, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { SoccerPitch } from "@/components/fantasy/SoccerPitch";
import { StatCard } from "@/components/shared/StatCard";
import { Badge } from "@/components/ui/badge";
import type { Profile, LeagueStanding, Gameweek, FantasyTeam, Player } from "@/types";
import { cn } from "@/lib/utils";

interface ManagerDetailClientProps {
  profile: Profile;
  standing: LeagueStanding | null;
  gameweek: Gameweek;
  fantasyTeam: FantasyTeam | null;
  rosterPlayers: Player[];
}

export function ManagerDetailClient({
  profile,
  standing,
  gameweek,
  fantasyTeam,
  rosterPlayers,
}: ManagerDetailClientProps) {
  const playerLookup = new Map(rosterPlayers.map((p) => [p.id, p]));

  const selections = fantasyTeam?.selections ?? [];
  const captainId = selections.find((s) => s.isCaptain)?.playerId;
  const selectedPlayers = selections
    .map((s) => playerLookup.get(s.playerId) ?? null)
    .filter(Boolean) as Player[];

  const isPublished = gameweek.status === "published";
  const hasTeam = selectedPlayers.length > 0;
  const isSubmitted = Boolean(fantasyTeam?.submittedAt);

  return (
    <div className="space-y-6 animate-slide-up max-w-2xl">
      {/* Back nav */}
      <Link
        href="/league"
        className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to League
      </Link>

      {/* Header */}
      <header className="flex items-start gap-4">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold shrink-0"
          style={{ backgroundColor: profile.avatarColor + "22", color: profile.avatarColor }}
        >
          {profile.initials}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">{profile.name}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {standing && (
              <Badge variant="outline" className="gap-1 text-xs">
                <Trophy className="h-3 w-3" />
                #{standing.rank}
              </Badge>
            )}
            {standing && (
              <span className="text-xs text-text-muted tabular-nums">
                {standing.seasonPoints} pts
              </span>
            )}
            {standing && <MovementPill movement={standing.rankMovement} />}
          </div>
        </div>
      </header>

      {/* Stats row */}
      {standing && (
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Season Pts" value={standing.seasonPoints} highlight />
          <StatCard label="GW Pts" value={standing.currentGameweekPoints} />
          <StatCard
            label="Avg GW"
            value={profile.averageGameweekPoints?.toFixed(1) ?? "—"}
          />
          <StatCard
            label="Best GW"
            value={profile.bestGameweek ?? "—"}
            subtext={profile.bestGameweekNumber ? `Gameweek ${profile.bestGameweekNumber}` : undefined}
          />
        </section>
      )}

      {/* Recent form sparkline */}
      {profile.recentGameweekPoints && profile.recentGameweekPoints.length > 0 && (
        <section className="surface-card p-4">
          <h2 className="text-xs font-semibold tracking-[0.15em] text-text-muted uppercase mb-3">
            Recent Form
          </h2>
          <div className="flex items-end gap-1.5 h-16">
            {profile.recentGameweekPoints.map((pts, i) => {
              const max = Math.max(...profile.recentGameweekPoints!);
              const height = max > 0 ? (pts / max) * 100 : 0;
              const gwNum = profile.recentGameweekNumbers?.[i];
              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <span className="text-[9px] text-text-muted tabular-nums">{pts}</span>
                  <div
                    className={cn(
                      "w-full rounded-sm transition-all",
                      i === profile.recentGameweekPoints!.length - 1
                        ? "bg-lime"
                        : "bg-lime/30"
                    )}
                    style={{ height: `${Math.max(height, 8)}%` }}
                  />
                  {gwNum != null && (
                    <span className="text-[8px] text-text-muted/60 tabular-nums">
                      {gwNum}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Fantasy team — last selection */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold tracking-[0.15em] text-text-muted uppercase">
            {isPublished ? `GW ${String(gameweek.number).padStart(2, "0")} Selection` : "Current Selection"}
          </h2>
          {isSubmitted && (
            <Badge variant="outline" className="text-[10px] gap-1">
              <Star className="h-2.5 w-2.5" />
              Submitted
            </Badge>
          )}
        </div>

        {hasTeam ? (
          <div className="surface-card p-4">
            <SoccerPitch
              players={Array.from({ length: 5 }, (_, i) => selectedPlayers[i] ?? null)}
              captainId={captainId}
            />
            {isPublished && standing && (
              <div className="mt-4 text-center">
                <p className="text-xs text-text-muted">Gameweek points</p>
                <p className="text-3xl font-bold text-lime tabular-nums mt-1">
                  {standing.currentGameweekPoints}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="surface-card p-6 text-center">
            <Calendar className="h-8 w-8 text-text-muted/40 mx-auto mb-2" />
            <p className="text-sm text-text-muted">
              {gameweek.id === "draft"
                ? "No gameweek active yet."
                : "No team submitted for this gameweek."}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function MovementPill({ movement }: { movement: number }) {
  if (movement === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] text-text-muted/50">
        <Minus className="h-2.5 w-2.5" />
      </span>
    );
  }
  const up = movement > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-[10px] font-medium",
        up ? "text-lime" : "text-danger"
      )}
    >
      {up ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
      {Math.abs(movement)}
    </span>
  );
}
