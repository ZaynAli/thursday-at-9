"use client";

import type { Player } from "@/types";
import { JerseyIcon } from "@/components/shared/JerseyIcon";
import { PlayerPrice } from "@/components/shared/PlayerPrice";
import { CaptainBadge } from "@/components/fantasy/CaptainBadge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Crown, UserMinus, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useIsMobile } from "@/hooks/useMediaQuery";

interface PlayerDetailProps {
  player: Player | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSelected: boolean;
  isCaptain: boolean;
  onMakeCaptain: () => void;
  onRemove: () => void;
}

function PlayerDetailContent({
  player,
  isSelected,
  isCaptain,
  onMakeCaptain,
  onRemove,
}: Omit<PlayerDetailProps, "open" | "onOpenChange">) {
  if (!player) return null;

  const hasLinkedProfile = Boolean(player.profileId);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4 pr-8">
        <div className="relative shrink-0">
          <JerseyIcon jerseyId={player.jerseyId} size="lg" />
          {isCaptain && (
            <div className="absolute -bottom-1 -right-1">
              <CaptainBadge size="sm" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold leading-tight truncate">{player.name}</h3>
          <div className="mt-1">
            <PlayerPrice price={player.price} size="lg" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Last GW" value={`${player.lastGameweekPoints} pts`} />
        <Stat label="Season" value={`${player.seasonFantasyPoints} pts`} highlight />
      </div>

      {isSelected ? (
        <div className="flex flex-col gap-2 border-t border-border pt-4">
          {!isCaptain && (
            <Button
              variant="outline"
              className="w-full justify-center gap-2 border-gold/30 text-gold hover:bg-gold/10"
              onClick={onMakeCaptain}
            >
              <Crown className="h-4 w-4" />
              Make Captain
            </Button>
          )}
          {isCaptain && (
            <p className="text-center text-xs text-gold">Current captain</p>
          )}
          <Button
            variant="outline"
            className="w-full justify-center gap-2 text-danger border-danger/30 hover:bg-danger/10"
            onClick={onRemove}
          >
            <UserMinus className="h-4 w-4" />
            Remove Player
          </Button>
        </div>
      ) : (
        <p className="text-sm text-text-muted text-center py-1">
          Add this player to your squad from the pool.
        </p>
      )}

      {hasLinkedProfile ? (
        <Link
          href="/profile"
          className="flex items-center justify-center gap-2 text-sm text-text-muted hover:text-lime transition-colors pt-1"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          View Profile
        </Link>
      ) : (
        <p className="text-xs text-text-muted text-center">
          No linked profile — this player hasn&apos;t signed up yet.
        </p>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3 text-center">
      <span className="text-[10px] uppercase tracking-wider text-text-muted">
        {label}
      </span>
      <p
        className={`text-lg font-bold tabular-nums mt-1 ${
          highlight ? "text-lime" : "text-text-primary"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export function PlayerDetailSheet({
  player,
  open,
  onOpenChange,
  isSelected,
  isCaptain,
  onMakeCaptain,
  onRemove,
}: PlayerDetailProps) {
  const isMobile = useIsMobile();

  if (!player) return null;

  const content = (
    <PlayerDetailContent
      player={player}
      isSelected={isSelected}
      isCaptain={isCaptain}
      onMakeCaptain={onMakeCaptain}
      onRemove={onRemove}
    />
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl border-border bg-surface-elevated px-4 pt-2 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] max-h-[85vh] overflow-y-auto"
        >
          <div className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-border" />
          <SheetHeader className="p-0 pb-4">
            <SheetTitle className="text-base font-semibold text-text-primary">
              {player.name}
            </SheetTitle>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-elevated border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{player.name}</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
