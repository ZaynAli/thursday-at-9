"use client";

import type { Player } from "@/types";
import { PlayerAvatar } from "@/components/shared/PlayerAvatar";
import { PlayerPrice } from "@/components/shared/PlayerPrice";
import { CaptainBadge } from "@/components/fantasy/CaptainBadge";
import { Button } from "@/components/ui/button";
import { Check, Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlayerRowProps {
  player: Player;
  isSelected: boolean;
  isCaptain: boolean;
  canAdd: boolean;
  unaffordableReason: string | null;
  onToggle: () => void;
  onSelect?: () => void;
  variant?: "desktop" | "mobile";
}

export function PlayerRow({
  player,
  isSelected,
  isCaptain,
  canAdd,
  unaffordableReason,
  onToggle,
  onSelect,
  variant = "desktop",
}: PlayerRowProps) {
  const disabled = !isSelected && (!canAdd || !!unaffordableReason);

  if (variant === "mobile") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg border transition-all",
          isSelected
            ? "bg-lime/5 border-lime/30"
            : disabled
              ? "bg-surface border-border opacity-60"
              : "bg-surface-elevated border-border active:bg-surface-hover"
        )}
        onClick={onSelect}
      >
        <PlayerAvatar initials={player.initials} size="md" isCaptain={isCaptain} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm truncate">{player.name}</span>
            {isCaptain && <CaptainBadge />}
          </div>
          <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
            <span>LW {player.lastGameweekPoints} pts</span>
          </div>
          {unaffordableReason && !isSelected && (
            <span className="text-xs text-danger mt-0.5 block">
              {unaffordableReason}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <PlayerPrice price={player.price} size="sm" />
          <Button
            size="icon-sm"
            variant={isSelected ? "default" : "outline"}
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className={cn(
              "h-8 w-8 rounded-full shrink-0",
              isSelected && "bg-lime text-background hover:bg-lime-muted"
            )}
          >
            {isSelected ? (
              <Check className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <tr
      className={cn(
        "group border-b border-border/50 transition-colors",
        isSelected ? "bg-lime/5" : "hover:bg-surface-hover/50",
        disabled && !isSelected && "opacity-50"
      )}
    >
      <td className="py-3 pl-4">
        <div className="flex items-center gap-3">
          <PlayerAvatar initials={player.initials} size="sm" isCaptain={isCaptain} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{player.name}</span>
              {isCaptain && <CaptainBadge />}
            </div>
            {unaffordableReason && !isSelected && (
              <span className="text-xs text-danger">{unaffordableReason}</span>
            )}
          </div>
        </div>
      </td>
      <td className="py-3 text-right">
        <PlayerPrice price={player.price} size="sm" />
      </td>
      <td className="py-3 text-right tabular-nums text-sm text-text-secondary">
        {player.lastGameweekPoints}
      </td>
      <td className="py-3 text-right tabular-nums text-sm text-text-muted">
        {player.ownershipPercent}%
      </td>
      <td className="py-3 pr-4 text-right">
        <Button
          size="icon-sm"
          variant={isSelected ? "default" : "outline"}
          disabled={disabled}
          onClick={onToggle}
          className={cn(
            "h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity",
            isSelected && "opacity-100 bg-lime text-background hover:bg-lime-muted"
          )}
        >
          {isSelected ? (
            <Minus className="h-3.5 w-3.5" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
        </Button>
      </td>
    </tr>
  );
}
