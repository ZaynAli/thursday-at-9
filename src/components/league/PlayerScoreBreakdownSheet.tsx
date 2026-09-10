"use client";

import {
  DEFENSIVE_STOP_SCORING_CAP,
  FANTASY_SCORING,
} from "@/lib/constants";
import { JerseyIcon } from "@/components/shared/JerseyIcon";
import { CaptainBadge } from "@/components/fantasy/CaptainBadge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/useMediaQuery";
import type { ManagerSquadPlayer } from "@/lib/data";
import { cn } from "@/lib/utils";

interface BreakdownLine {
  label: string;
  detail?: string;
  points: number;
}

function buildBreakdown(player: ManagerSquadPlayer): BreakdownLine[] {
  const stats = player.stats;
  if (!stats || !stats.appeared) {
    return [{ label: "Did not appear", points: 0 }];
  }

  const lines: BreakdownLine[] = [
    { label: "Appearance", points: FANTASY_SCORING.appearance },
  ];

  if (stats.won) {
    lines.push({ label: "Win", points: FANTASY_SCORING.win });
  } else if (stats.drew) {
    lines.push({ label: "Draw", points: FANTASY_SCORING.draw });
  }

  if (stats.goals > 0) {
    lines.push({
      label: "Goals",
      detail: `${stats.goals} × ${FANTASY_SCORING.goal}`,
      points: stats.goals * FANTASY_SCORING.goal,
    });
  }

  if (stats.assists > 0) {
    lines.push({
      label: "Assists",
      detail: `${stats.assists} × ${FANTASY_SCORING.assist}`,
      points: stats.assists * FANTASY_SCORING.assist,
    });
  }

  if (stats.defensiveStops > 0) {
    const counted = Math.min(stats.defensiveStops, DEFENSIVE_STOP_SCORING_CAP);
    lines.push({
      label: "Defensive stops",
      detail:
        counted < stats.defensiveStops
          ? `${counted} counted (of ${stats.defensiveStops}) × ${FANTASY_SCORING.defensiveStop}`
          : `${counted} × ${FANTASY_SCORING.defensiveStop}`,
      points: counted * FANTASY_SCORING.defensiveStop,
    });
  }

  return lines;
}

function BreakdownBody({ player }: { player: ManagerSquadPlayer }) {
  const lines = buildBreakdown(player);
  const base = player.basePoints ?? lines.reduce((sum, line) => sum + line.points, 0);
  const applied = player.appliedPoints ?? base;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4 pr-8">
        <div className="relative shrink-0">
          <JerseyIcon jerseyId={player.jerseyId} size="lg" />
          {player.isCaptain && (
            <div className="absolute -bottom-1 -right-1">
              <CaptainBadge size="sm" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-bold leading-tight truncate">{player.name}</h3>
          {player.isCaptain && (
            <p className="text-xs text-lime font-medium mt-0.5">Captain · 2×</p>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <tbody>
            {lines.map((line) => (
              <tr key={line.label} className="border-b border-border/50 last:border-0">
                <td className="py-2.5 pl-3">
                  <div className="font-medium">{line.label}</div>
                  {line.detail && (
                    <div className="text-[11px] text-text-muted">{line.detail}</div>
                  )}
                </td>
                <td
                  className={cn(
                    "py-2.5 pr-3 text-right tabular-nums font-semibold",
                    line.points > 0 ? "text-lime" : "text-text-muted"
                  )}
                >
                  {line.points > 0 ? `+${line.points}` : "0"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2.5">
        <span className="text-xs text-text-muted uppercase tracking-wider">
          Player total
        </span>
        <span className="text-sm font-semibold tabular-nums">{base} pts</span>
      </div>

      {player.isCaptain && (
        <div className="flex items-center justify-between rounded-lg border border-lime/20 bg-lime/5 px-3 py-2.5">
          <span className="text-xs text-lime uppercase tracking-wider font-semibold">
            Toward manager ({base} × 2)
          </span>
          <span className="text-base font-bold tabular-nums text-lime">
            {applied} pts
          </span>
        </div>
      )}
    </div>
  );
}

interface PlayerScoreBreakdownSheetProps {
  player: ManagerSquadPlayer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlayerScoreBreakdownSheet({
  player,
  open,
  onOpenChange,
}: PlayerScoreBreakdownSheetProps) {
  const isMobile = useIsMobile();

  if (!player) return null;

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="bg-surface-elevated border-border max-h-[85vh] overflow-y-auto"
        >
          <SheetHeader className="pb-2">
            <SheetTitle>Point breakdown</SheetTitle>
            <SheetDescription className="sr-only">
              How {player.name} scored this gameweek
            </SheetDescription>
          </SheetHeader>
          <BreakdownBody player={player} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-elevated border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Point breakdown</DialogTitle>
          <DialogDescription className="sr-only">
            How {player.name} scored this gameweek
          </DialogDescription>
        </DialogHeader>
        <BreakdownBody player={player} />
      </DialogContent>
    </Dialog>
  );
}
