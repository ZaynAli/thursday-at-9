import type { GameweekRecap } from "@/types";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface LatestGameweekProps {
  recap: GameweekRecap;
  className?: string;
}

export function LatestGameweek({ recap, className }: LatestGameweekProps) {
  const movement = recap.userRankMovement;

  return (
    <div className={cn("surface-card p-4", className)}>
      <h3 className="text-xs font-semibold tracking-[0.15em] text-text-muted uppercase mb-4">
        Gameweek {String(recap.gameweekNumber).padStart(2, "0")} Recap
      </h3>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-text-muted">Final Score</span>
          <span className="text-sm font-semibold">{recap.finalScore}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-text-muted">Top Scorer</span>
          <span className="text-sm">
            <span className="font-semibold">{recap.highestScorerName}</span>
            <span className="text-lime ml-1.5 tabular-nums">
              {recap.highestScorerPoints} pts
            </span>
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-text-muted">Your Score</span>
          <span className="text-sm font-bold tabular-nums text-lime">
            {recap.userGameweekPoints} pts
          </span>
        </div>
        <div className="flex justify-between items-center pt-1 border-t border-border">
          <span className="text-sm text-text-muted">Rank Movement</span>
          <RankMovement movement={movement} />
        </div>
      </div>
    </div>
  );
}

function RankMovement({ movement }: { movement: number }) {
  if (movement > 0) {
    return (
      <span className="flex items-center gap-1 text-sm text-lime font-medium">
        <TrendingUp className="h-3.5 w-3.5" />↑{movement}
      </span>
    );
  }
  if (movement < 0) {
    return (
      <span className="flex items-center gap-1 text-sm text-danger font-medium">
        <TrendingDown className="h-3.5 w-3.5" />↓{Math.abs(movement)}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-sm text-text-muted">
      <Minus className="h-3.5 w-3.5" />—
    </span>
  );
}
