"use client";

import {
  DEFENSIVE_STOP_SCORING_CAP,
  FANTASY_BUDGET,
  FANTASY_SCORING,
} from "@/lib/constants";
import { Button } from "@/components/ui/button";
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
import { CircleHelp } from "lucide-react";
import { useState } from "react";

const SCORING_ROWS = [
  { label: "Appearance", points: FANTASY_SCORING.appearance, note: "Played in the session" },
  { label: "Win", points: FANTASY_SCORING.win, note: "Team won the match" },
  { label: "Draw", points: FANTASY_SCORING.draw, note: "Match finished level" },
  { label: "Goal", points: FANTASY_SCORING.goal, note: "Per goal scored" },
  { label: "Assist", points: FANTASY_SCORING.assist, note: "Per assist" },
  {
    label: "Defensive stop",
    points: FANTASY_SCORING.defensiveStop,
    note: `Per stop · max ${DEFENSIVE_STOP_SCORING_CAP} counted`,
  },
] as const;

function ScoringGuideBody() {
  return (
    <div className="space-y-5">
      <p className="text-sm text-text-muted">
        Each real player earns fantasy points from the Thursday session. Your
        manager score is the sum of your 5 picks — captain counts double.
      </p>

      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-elevated/50 text-[10px] uppercase tracking-wider text-text-muted">
              <th className="py-2.5 pl-3 text-left font-medium">Action</th>
              <th className="py-2.5 pr-3 text-right font-medium">Pts</th>
            </tr>
          </thead>
          <tbody>
            {SCORING_ROWS.map((row) => (
              <tr key={row.label} className="border-b border-border/50 last:border-0">
                <td className="py-2.5 pl-3">
                  <div className="font-medium text-text-primary">{row.label}</div>
                  <div className="text-[11px] text-text-muted">{row.note}</div>
                </td>
                <td className="py-2.5 pr-3 text-right tabular-nums font-semibold text-lime">
                  +{row.points}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border border-lime/20 bg-lime/5 px-3 py-2.5 space-y-1">
        <p className="text-xs font-semibold text-lime uppercase tracking-wider">
          Captain
        </p>
        <p className="text-sm text-text-muted">
          Your captain&apos;s points are multiplied by <span className="text-lime font-semibold">2×</span>.
        </p>
      </div>

      <p className="text-[11px] text-text-muted">
        Players who didn&apos;t appear score 0. Squad of 5 · ${FANTASY_BUDGET.toFixed(1)}m budget.
      </p>
    </div>
  );
}

interface ScoringGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ScoringGuideSheet({ open, onOpenChange }: ScoringGuideProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="bg-surface-elevated border-border max-h-[85vh] overflow-y-auto">
          <SheetHeader className="pb-2">
            <SheetTitle>Points system</SheetTitle>
            <SheetDescription className="sr-only">
              How fantasy points are awarded
            </SheetDescription>
          </SheetHeader>
          <ScoringGuideBody />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-elevated border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Points system</DialogTitle>
          <DialogDescription className="sr-only">
            How fantasy points are awarded
          </DialogDescription>
        </DialogHeader>
        <ScoringGuideBody />
      </DialogContent>
    </Dialog>
  );
}

/** Compact trigger used on the Fantasy tab. */
export function ScoringGuideButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={className}
        onClick={() => setOpen(true)}
      >
        <CircleHelp className="h-3.5 w-3.5" />
        Points
      </Button>
      <ScoringGuideSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
