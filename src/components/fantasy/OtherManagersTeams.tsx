"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { SoccerPitch } from "@/components/fantasy/SoccerPitch";
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
import type { ManagerFantasyTeamView } from "@/lib/data/fantasy-teams";
import type { Player } from "@/types";

function squadPlayersForTeam(
  team: ManagerFantasyTeamView,
  roster: Player[]
): { players: (Player | null)[]; captainId?: string } {
  const lookup = new Map(roster.map((player) => [player.id, player]));
  const players: (Player | null)[] = Array.from({ length: 5 }, (_, i) => {
    const selection = team.selections[i];
    if (!selection) return null;
    return lookup.get(selection.playerId) ?? null;
  });
  const captainId = team.selections.find((s) => s.isCaptain)?.playerId;
  return { players, captainId };
}

function TeamFormationBody({
  team,
  roster,
}: {
  team: ManagerFantasyTeamView;
  roster: Player[];
}) {
  const { players, captainId } = squadPlayersForTeam(team, roster);

  return (
    <div className="space-y-3">
      <SoccerPitch players={players} captainId={captainId} />
      <ul className="space-y-1.5 border-t border-border pt-3">
        {team.selections.map((selection) => {
          const player = roster.find((p) => p.id === selection.playerId);
          return (
            <li
              key={selection.playerId}
              className="flex items-center justify-between text-sm py-0.5"
            >
              <span className="font-medium">
                {player?.name ?? "Player"}
                {selection.isCaptain && (
                  <span className="ml-1.5 text-[10px] text-lime font-semibold">
                    (C)
                  </span>
                )}
              </span>
              {player && (
                <span className="text-xs text-text-muted tabular-nums">
                  ${player.price.toFixed(1)}m
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

interface SubmittedTeamSheetProps {
  team: ManagerFantasyTeamView | null;
  roster: Player[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function SubmittedTeamSheet({
  team,
  roster,
  open,
  onOpenChange,
}: SubmittedTeamSheetProps) {
  const isMobile = useIsMobile();

  if (!team) return null;

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="bg-surface-elevated border-border max-h-[90vh] overflow-y-auto"
        >
          <SheetHeader className="pb-2">
            <SheetTitle>{team.managerName}</SheetTitle>
            <SheetDescription className="sr-only">
              Submitted fantasy formation for {team.managerName}
            </SheetDescription>
          </SheetHeader>
          <TeamFormationBody team={team} roster={roster} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-elevated border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{team.managerName}</DialogTitle>
          <DialogDescription className="sr-only">
            Submitted fantasy formation for {team.managerName}
          </DialogDescription>
        </DialogHeader>
        <TeamFormationBody team={team} roster={roster} />
      </DialogContent>
    </Dialog>
  );
}

interface OtherManagersTeamsProps {
  teams: ManagerFantasyTeamView[];
  roster: Player[];
}

export function OtherManagersTeams({ teams, roster }: OtherManagersTeamsProps) {
  const [selected, setSelected] = useState<ManagerFantasyTeamView | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <section className="rounded-lg border border-border bg-surface p-4 space-y-4">
      <div>
        <h2 className="text-xs font-semibold tracking-[0.15em] text-text-muted uppercase">
          Submitted Teams
        </h2>
        <p className="text-sm text-text-muted mt-1">
          Tap a manager to see their formation — {teams.length} submitted.
        </p>
      </div>
      <div className="space-y-2">
        {teams.map((team) => (
          <button
            key={team.managerId}
            type="button"
            onClick={() => {
              setSelected(team);
              setOpen(true);
            }}
            className="flex w-full items-center gap-3 rounded-md border border-border/70 bg-surface-elevated px-3 py-2.5 text-left transition-colors hover:bg-surface-hover/60 active:bg-surface-hover/80"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{team.managerName}</p>
              <p className="text-xs text-text-muted mt-0.5 truncate">
                {team.selections
                  .map((selection) => {
                    const player = roster.find((p) => p.id === selection.playerId);
                    const captain = selection.isCaptain ? " (C)" : "";
                    return `${player?.name ?? "Player"}${captain}`;
                  })
                  .join(" · ")}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-text-muted/50 shrink-0" />
          </button>
        ))}
      </div>

      <SubmittedTeamSheet
        team={selected}
        roster={roster}
        open={open}
        onOpenChange={setOpen}
      />
    </section>
  );
}
