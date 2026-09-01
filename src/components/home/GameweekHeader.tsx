"use client";

import { useMemo } from "react";
import { useCountdown } from "@/hooks/useCountdown";
import { getNextFantasyDeadline } from "@/lib/gameweek-timing";
import { useAppSession } from "@/context/AppSessionContext";
import { GAME_TIME, LEAGUE_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface CountdownProps {
  target?: Date;
  label?: string;
  compact?: boolean;
  className?: string;
}

export function Countdown({
  target,
  label = "Team locks in",
  compact = false,
  className,
}: CountdownProps) {
  const { gameweek } = useAppSession();
  const deadline = useMemo(() => {
    if (target) return target;
    if (gameweek.fantasyDeadline) return new Date(gameweek.fantasyDeadline);
    return getNextFantasyDeadline();
  }, [target, gameweek.fantasyDeadline]);

  const { formatted, isExpired } = useCountdown(deadline);

  return (
    <div className={cn("flex flex-col", className)}>
      {!compact && (
        <span className="text-[10px] font-medium tracking-[0.15em] text-text-muted uppercase mb-1">
          {label}
        </span>
      )}
      <div
        className={cn(
          "font-mono tabular-nums font-bold tracking-wider",
          compact ? "text-lg" : "text-2xl sm:text-3xl",
          isExpired ? "text-danger" : "text-lime"
        )}
      >
        {formatted}
      </div>
    </div>
  );
}

interface GameweekHeaderProps {
  gameweekNumber: number;
  showCountdown?: boolean;
  compact?: boolean;
  className?: string;
}

export function GameweekHeader({
  gameweekNumber,
  showCountdown = true,
  compact = false,
  className,
}: GameweekHeaderProps) {
  return (
    <div className={cn("relative", className)}>
      {!compact && (
        <div className="mb-1">
          <span className="text-[10px] font-semibold tracking-[0.25em] text-text-muted uppercase">
            {LEAGUE_NAME}
          </span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-baseline gap-3">
            <span className="text-xs font-medium tracking-[0.2em] text-text-muted uppercase">
              Gameweek
            </span>
            <span className="text-4xl sm:text-5xl font-bold tabular-nums text-text-primary tracking-tight">
              {String(gameweekNumber).padStart(2, "0")}
            </span>
          </div>

          <div className="mt-2 flex items-center gap-3">
            <div>
              <span className="text-[10px] font-medium tracking-[0.15em] text-text-muted uppercase block">
                {GAME_TIME.dayLabel} Night
              </span>
              <span className="text-xl font-bold text-lime tabular-nums">
                {GAME_TIME.label}
              </span>
            </div>
          </div>
        </div>

        {showCountdown && (
          <Countdown compact={compact} className="sm:text-right" />
        )}
      </div>
    </div>
  );
}
