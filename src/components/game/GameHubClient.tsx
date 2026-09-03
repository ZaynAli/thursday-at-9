"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MatchFormationPitch } from "@/components/game/MatchFormationPitch";
import { Countdown } from "@/components/home/GameweekHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { useAppSession, usePlayerLookup } from "@/context/AppSessionContext";
import { updateMatchFormationAction } from "@/lib/admin/game-actions";
import { formatGameDate } from "@/lib/gameweek-timing";
import {
  reconcileFormation,
  swapFormationSlots,
  type TeamFormation,
} from "@/lib/formations";
import {
  getGameStatusLabel,
  getGameStatusVariant,
  hasLineups,
  isGameComplete,
} from "@/lib/game/status";
import type { SessionTeam } from "@/lib/session-formats";
import { GAME_TIME } from "@/lib/constants";
import { cn } from "@/lib/utils";

export interface GamePlayerStat {
  playerId: string;
  goals: number;
  assists: number;
  defensiveStops: number;
}

interface GameHubClientProps {
  initialPlayerStats?: GamePlayerStat[];
}

function formatStatLine(stat: GamePlayerStat): string | undefined {
  const parts: string[] = [];
  if (stat.goals > 0) parts.push(`${stat.goals}G`);
  if (stat.assists > 0) parts.push(`${stat.assists}A`);
  if (stat.defensiveStops > 0) parts.push(`${stat.defensiveStops}D`);
  return parts.length > 0 ? parts.join(" · ") : undefined;
}

export function GameHubClient({ initialPlayerStats = [] }: GameHubClientProps) {
  const router = useRouter();
  const { gameweek, dataSource, currentUser: user } = useAppSession();
  const playerLookup = usePlayerLookup();
  const isAdmin = user?.isAdmin ?? false;

  const [formation, setFormation] = useState<TeamFormation>(() => {
    if (gameweek.teamAssignments) {
      return reconcileFormation(
        gameweek.teamFormation,
        gameweek.teamAssignments,
        gameweek.format
      );
    }
    return gameweek.teamFormation ?? { white: [], color: [] };
  });
  const [selectedSlot, setSelectedSlot] = useState<{ team: SessionTeam; slot: number } | null>(
    null
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!gameweek.teamAssignments) return;
    setFormation(
      reconcileFormation(
        gameweek.teamFormation,
        gameweek.teamAssignments,
        gameweek.format
      )
    );
  }, [gameweek.teamFormation, gameweek.teamAssignments, gameweek.format]);

  const gameDate = useMemo(() => new Date(gameweek.date), [gameweek.date]);
  const countdownTarget = useMemo(
    () => new Date(gameweek.fantasyDeadline || gameweek.date),
    [gameweek.fantasyDeadline, gameweek.date]
  );
  const showLineups = hasLineups(gameweek.status) && gameweek.teamAssignments;
  const gameFinished = isGameComplete(gameweek.status);
  const hasScores =
    gameweek.matchScores?.white != null && gameweek.matchScores?.color != null;

  const playerStatLines = useMemo(() => {
    const lines: Record<string, string> = {};
    for (const stat of initialPlayerStats) {
      const line = formatStatLine(stat);
      if (line) lines[stat.playerId] = line;
    }
    return lines;
  }, [initialPlayerStats]);

  const topScorers = useMemo(() => {
    return [...initialPlayerStats]
      .filter((s) => s.goals > 0 || s.assists > 0)
      .sort((a, b) => b.goals * 10 + b.assists - (a.goals * 10 + a.assists))
      .slice(0, 5);
  }, [initialPlayerStats]);

  const persistFormation = useCallback(
    (next: TeamFormation) => {
      setFormation(next);
      if (dataSource === "mock" || gameweek.id === "draft") return;

      startTransition(async () => {
        setSaveError(null);
        const result = await updateMatchFormationAction(gameweek.id, next);
        if (!result.ok) {
          setSaveError(result.error);
          return;
        }
        router.refresh();
      });
    },
    [dataSource, gameweek.id, router]
  );

  const handleSlotClick = useCallback(
    (team: SessionTeam, slot: number) => {
      if (!isAdmin) return;

      if (!selectedSlot) {
        setSelectedSlot({ team, slot });
        return;
      }

      if (selectedSlot.team === team && selectedSlot.slot === slot) {
        setSelectedSlot(null);
        return;
      }

      if (selectedSlot.team !== team) {
        setSelectedSlot({ team, slot });
        return;
      }

      const next = swapFormationSlots(formation, selectedSlot, { team, slot });
      setSelectedSlot(null);
      persistFormation(next);
    },
    [formation, isAdmin, persistFormation, selectedSlot]
  );

  if (gameweek.id === "draft" || !showLineups) {
    return (
      <div className="space-y-6 animate-slide-up">
        <header>
          <p className="text-[10px] font-semibold tracking-[0.25em] text-text-muted uppercase mb-1">
            Game Hub
          </p>
          <h1 className="text-2xl font-bold">This week&apos;s match</h1>
        </header>
        <EmptyState
          title="Lineups not ready yet"
          description="The admin is still setting up this week's session. Check back once teams are assigned."
        />
      </div>
    );
  }

  const teamWhiteName = gameweek.teamWhiteName ?? "White";
  const teamColorName = gameweek.teamColorName ?? "Colours";

  return (
    <div className="space-y-6 animate-slide-up">
      <header className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.25em] text-text-muted uppercase mb-1">
              Game Hub · GW{String(gameweek.number).padStart(2, "0")}
            </p>
            <h1 className="text-2xl font-bold">
              {teamWhiteName}{" "}
              <span className="text-text-muted font-normal">vs</span> {teamColorName}
            </h1>
            <p className="text-sm text-text-muted mt-1">
              {formatGameDate(gameDate)} · {GAME_TIME.label} {GAME_TIME.timezoneLabel}
            </p>
          </div>
          <Badge variant={getGameStatusVariant(gameweek.status)}>
            {getGameStatusLabel(gameweek.status)}
          </Badge>
        </div>

        {!gameFinished && (
          <div className="rounded-lg border border-border bg-surface/60 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span className="text-xs text-text-muted">Kickoff in</span>
            <Countdown target={countdownTarget} label="" compact />
          </div>
        )}
      </header>

      {hasScores && (
        <section className="rounded-lg border border-border bg-surface p-4">
          <h2 className="text-xs font-semibold tracking-[0.15em] text-text-muted uppercase mb-3">
            Final Score
          </h2>
          <div className="flex items-center justify-center gap-4 sm:gap-8">
            <div className="text-center min-w-0 flex-1">
              <p className="text-xs text-text-muted truncate">{teamWhiteName}</p>
              <p className="text-4xl font-bold tabular-nums text-text-primary">
                {gameweek.matchScores!.white}
              </p>
            </div>
            <span className="text-text-muted text-sm">–</span>
            <div className="text-center min-w-0 flex-1">
              <p className="text-xs text-text-muted truncate">{teamColorName}</p>
              <p className="text-4xl font-bold tabular-nums text-text-primary">
                {gameweek.matchScores!.color}
              </p>
            </div>
          </div>
        </section>
      )}

      {!hasScores && !gameFinished && (
        <section>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-elevated/60 px-3 py-1.5">
            <span className="text-xs font-semibold text-text-primary tabular-nums">{gameweek.format}</span>
          </div>
        </section>
      )}

      <section className="surface-card p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4 gap-3">
          <h2 className="text-xs font-semibold tracking-[0.15em] text-text-muted uppercase">
            {gameFinished ? "Match Lineups" : "Team Lineups"}
          </h2>
          {isAdmin && (
            <p className="text-[10px] text-text-muted text-right">
              {isPending ? "Saving…" : "Tap a player, then another slot on the same team"}
            </p>
          )}
        </div>

        <MatchFormationPitch
          formation={formation}
          playersById={playerLookup}
          format={gameweek.format}
          teamWhiteName={teamWhiteName}
          teamColorName={teamColorName}
          editable={isAdmin}
          selectedSlot={selectedSlot}
          onSlotClick={handleSlotClick}
          playerStatLines={gameFinished ? playerStatLines : undefined}
        />

        {saveError && (
          <p className="mt-3 text-xs text-danger text-center">{saveError}</p>
        )}
      </section>

      {gameFinished && topScorers.length > 0 && (
        <section className="surface-card p-4">
          <h2 className="text-xs font-semibold tracking-[0.15em] text-text-muted uppercase mb-3">
            Match Highlights
          </h2>
          <ul className="space-y-2">
            {topScorers.map((stat) => {
              const player = playerLookup.get(stat.playerId);
              const line = formatStatLine(stat);
              if (!player || !line) return null;
              return (
                <li
                  key={stat.playerId}
                  className="flex items-center justify-between text-sm py-1.5 border-b border-border/50 last:border-0"
                >
                  <span className="font-medium">{player.name}</span>
                  <span className={cn("text-lime text-xs font-semibold tabular-nums")}>
                    {line}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
