"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Trophy,
  Star,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { SoccerPitch } from "@/components/fantasy/SoccerPitch";
import { PlayerScoreBreakdownSheet } from "@/components/league/PlayerScoreBreakdownSheet";
import { StatCard } from "@/components/shared/StatCard";
import { Badge } from "@/components/ui/badge";
import type { ManagerGameweekReview, ManagerSquadPlayer } from "@/lib/data";
import type { Player } from "@/types";
import { cn } from "@/lib/utils";

interface ManagerDetailClientProps {
  review: ManagerGameweekReview;
}

export function ManagerDetailClient({ review }: ManagerDetailClientProps) {
  const {
    profile,
    displayName,
    standing,
    gameweek,
    squad,
    teamTotal,
    showPoints,
    isSubmitted,
  } = review;

  const [selectedPlayer, setSelectedPlayer] = useState<ManagerSquadPlayer | null>(
    null
  );
  const [breakdownOpen, setBreakdownOpen] = useState(false);

  const captainId = squad.find((s) => s.isCaptain)?.playerId;
  const pitchPlayers: (Player | null)[] = Array.from({ length: 5 }, (_, i) => {
    const entry = squad[i];
    if (!entry) return null;
    return {
      id: entry.playerId,
      name: entry.name,
      initials: entry.initials,
      skillLevel: 3,
      price: 0,
      isActive: true,
      jerseyId: entry.jerseyId,
      form: 0,
      lastGameweekPoints: entry.basePoints ?? 0,
      seasonFantasyPoints: 0,
      ownershipPercent: 0,
      appearances: 0,
      goals: 0,
      assists: 0,
      defensiveStops: 0,
      wins: 0,
    };
  });

  const playerPoints: Record<string, number> = {};
  for (const entry of squad) {
    if (entry.appliedPoints != null) {
      playerPoints[entry.playerId] = entry.appliedPoints;
    }
  }

  const openPlayer = (player: Player) => {
    const entry = squad.find((s) => s.playerId === player.id);
    if (!entry) return;
    if (!showPoints) return;
    setSelectedPlayer(entry);
    setBreakdownOpen(true);
  };

  const hasTeam = squad.length > 0;
  const gwLabel = `GW ${String(gameweek.number).padStart(2, "0")}`;

  return (
    <div className="space-y-6 animate-slide-up max-w-2xl">
      <Link
        href="/league"
        className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to League
      </Link>

      <header className="flex items-start gap-4">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold shrink-0"
          style={{
            backgroundColor: profile.avatarColor + "22",
            color: profile.avatarColor,
          }}
        >
          {profile.initials}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">{displayName}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {standing && (
              <Badge variant="outline" className="gap-1 text-xs">
                <Trophy className="h-3 w-3" />
                #{standing.rank}
              </Badge>
            )}
            {standing && (
              <span className="text-xs text-text-muted tabular-nums">
                {standing.seasonPoints} pts season
              </span>
            )}
            {standing && <MovementPill movement={standing.rankMovement} />}
          </div>
        </div>
      </header>

      {standing && (
        <section className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard label="Season Pts" value={standing.seasonPoints} highlight />
          <StatCard
            label={`${gwLabel} Pts`}
            value={teamTotal ?? standing.currentGameweekPoints}
          />
          <StatCard label="Rank" value={`#${standing.rank}`} />
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xs font-semibold tracking-[0.15em] text-text-muted uppercase">
            {showPoints ? `${gwLabel} Result` : `${gwLabel} Selection`}
          </h2>
          <div className="flex items-center gap-2">
            {isSubmitted && (
              <Badge variant="outline" className="text-[10px] gap-1">
                <Star className="h-2.5 w-2.5" />
                Submitted
              </Badge>
            )}
            {showPoints && (
              <Badge variant="outline" className="text-[10px]">
                Final
              </Badge>
            )}
          </div>
        </div>

        {hasTeam ? (
          <div className="surface-card p-4 space-y-4">
            <SoccerPitch
              players={pitchPlayers}
              captainId={captainId}
              showPoints={showPoints}
              playerPoints={showPoints ? playerPoints : undefined}
              onPlayerClick={showPoints ? openPlayer : undefined}
            />

            {showPoints && (
              <p className="text-[11px] text-text-muted text-center">
                Tap a player to see how they scored
              </p>
            )}

            {showPoints && teamTotal != null && (
              <div className="text-center border-t border-border pt-4">
                <p className="text-xs text-text-muted uppercase tracking-wider">
                  {gwLabel} total
                </p>
                <p className="text-3xl font-bold text-lime tabular-nums mt-1">
                  {teamTotal}
                </p>
                <p className="text-[10px] text-text-muted mt-1">
                  Captain scores 2×
                </p>
              </div>
            )}

            {!showPoints && (
              <p className="text-xs text-text-muted text-center">
                Points appear here after the admin publishes results.
              </p>
            )}

            {showPoints && (
              <ul className="space-y-2 border-t border-border pt-3">
                {squad.map((entry) => (
                  <li key={entry.playerId}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPlayer(entry);
                        setBreakdownOpen(true);
                      }}
                      className="flex w-full items-center justify-between text-sm py-1.5 rounded-md hover:bg-surface-hover/50 transition-colors px-1 -mx-1"
                    >
                      <span className="font-medium text-left">
                        {entry.name}
                        {entry.isCaptain && (
                          <span className="ml-1.5 text-[10px] text-lime font-semibold">
                            (C)
                          </span>
                        )}
                      </span>
                      <span className="tabular-nums text-lime font-semibold">
                        {entry.appliedPoints ?? 0}
                        {entry.isCaptain && entry.basePoints != null && (
                          <span className="text-text-muted font-normal text-xs ml-1">
                            ({entry.basePoints}×2)
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="surface-card p-6 text-center">
            <Calendar className="h-8 w-8 text-text-muted/40 mx-auto mb-2" />
            <p className="text-sm text-text-muted">
              {gameweek.id === "draft"
                ? "No gameweek active yet."
                : showPoints
                  ? `No team was submitted for ${gwLabel}.`
                  : "No team submitted for this gameweek yet."}
            </p>
          </div>
        )}
      </section>

      <PlayerScoreBreakdownSheet
        player={selectedPlayer}
        open={breakdownOpen}
        onOpenChange={setBreakdownOpen}
      />
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
      {up ? (
        <TrendingUp className="h-2.5 w-2.5" />
      ) : (
        <TrendingDown className="h-2.5 w-2.5" />
      )}
      {Math.abs(movement)}
    </span>
  );
}
