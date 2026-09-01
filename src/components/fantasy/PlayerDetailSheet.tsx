"use client";

import type { Player } from "@/types";
import { PlayerAvatar } from "@/components/shared/PlayerAvatar";
import { PlayerPrice } from "@/components/shared/PlayerPrice";
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
      <div className="flex items-center gap-4">
        <PlayerAvatar initials={player.initials} size="lg" isCaptain={isCaptain} />
        <div>
          <h3 className="text-lg font-bold">{player.name}</h3>
          <PlayerPrice price={player.price} size="lg" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Form" value={player.form.toFixed(1)} highlight />
        <Stat label="Last GW" value={`${player.lastGameweekPoints} pts`} />
        <Stat label="Season" value={`${player.seasonFantasyPoints} pts`} />
        <Stat label="Owned" value={`${player.ownershipPercent}%`} />
      </div>

      {isSelected && (
        <div className="flex flex-col gap-2 pt-2">
          {!isCaptain && (
            <Button
              variant="outline"
              className="w-full justify-start gap-2 border-gold/30 text-gold hover:bg-gold/10"
              onClick={onMakeCaptain}
            >
              <Crown className="h-4 w-4" />
              Make Captain
            </Button>
          )}
          <Button
            variant="outline"
            className="w-full justify-start gap-2 text-danger border-danger/30 hover:bg-danger/10"
            onClick={onRemove}
          >
            <UserMinus className="h-4 w-4" />
            Remove Player
          </Button>
        </div>
      )}

      {hasLinkedProfile ? (
        <Link
          href="/profile"
          className="flex items-center gap-2 text-sm text-text-muted hover:text-lime transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          View Profile
        </Link>
      ) : (
        <p className="text-xs text-text-muted">
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
    <div className="surface-card p-3">
      <span className="text-[10px] uppercase tracking-wider text-text-muted">
        {label}
      </span>
      <p
        className={`text-lg font-bold tabular-nums mt-0.5 ${
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
          className="bg-surface-elevated border-border rounded-t-2xl max-h-[85vh]"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>{player.name}</SheetTitle>
          </SheetHeader>
          <div className="pb-6">{content}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-elevated border-border sm:max-w-md">
        <DialogHeader className="sr-only">
          <DialogTitle>{player.name}</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
