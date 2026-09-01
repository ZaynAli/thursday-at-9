import Link from "next/link";
import type { Player } from "@/types";
import { PlayerAvatar } from "@/components/shared/PlayerAvatar";
import { PlayerPrice } from "@/components/shared/PlayerPrice";
import { CaptainBadge } from "@/components/fantasy/CaptainBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamPreviewProps {
  players: Player[];
  captainId?: string;
  className?: string;
}

export function TeamPreview({ players, captainId, className }: TeamPreviewProps) {
  if (players.length === 0) {
    return (
      <div className={cn("surface-card", className)}>
        <EmptyState
          title="No team selected yet"
          description="Pick your 5 players before the deadline"
          action={
            <Link
              href="/fantasy"
              className="inline-flex h-7 items-center justify-center rounded-lg bg-lime px-2.5 text-[0.8rem] font-medium text-background hover:bg-lime-muted transition-colors"
            >
              Build Your Team
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className={cn("surface-card p-4", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold tracking-[0.15em] text-text-muted uppercase">
          Your Team
        </h3>
        <Link
          href="/fantasy"
          className="text-xs text-lime hover:text-lime-muted flex items-center gap-0.5 transition-colors"
        >
          Edit team
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        {players.map((player) => (
          <div key={player.id} className="flex flex-col items-center gap-1.5 w-16">
            <PlayerAvatar
              initials={player.initials}
              size="md"
              isCaptain={player.id === captainId}
            />
            <span className="text-[11px] font-medium text-center truncate w-full">
              {player.name.split(" ")[0]}
            </span>
            <PlayerPrice price={player.price} size="sm" className="text-[10px]" />
          </div>
        ))}
      </div>
    </div>
  );
}
