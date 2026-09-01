"use client";

import { BudgetBar } from "./BudgetBar";
import { SoccerPitch } from "./SoccerPitch";
import type { Player } from "@/types";
import type { JerseyId } from "@/lib/jerseys";
import { cn } from "@/lib/utils";
import { SQUAD_SIZE } from "@/lib/constants";

interface FantasySquadSummaryProps {
  selectedPlayers: Player[];
  captainId?: string;
  budgetRemaining: number;
  squadCost: number;
  onPlayerClick?: (player: Player) => void;
  showPitch?: boolean;
  jerseyId?: JerseyId;
  className?: string;
}

export function FantasySquadSummary({
  selectedPlayers,
  captainId,
  budgetRemaining,
  squadCost,
  onPlayerClick,
  showPitch = true,
  jerseyId,
  className,
}: FantasySquadSummaryProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <h3 className="text-xs font-semibold tracking-[0.15em] text-text-muted uppercase mb-3">
          Your Squad
        </h3>
        <BudgetBar
          selectedCount={selectedPlayers.length}
          budgetRemaining={budgetRemaining}
          squadCost={squadCost}
        />
      </div>

      {showPitch && (
        <SoccerPitch
          players={selectedPlayers}
          captainId={captainId}
          jerseyId={jerseyId}
          onPlayerClick={onPlayerClick}
        />
      )}

      {selectedPlayers.length === 0 && (
        <p className="text-sm text-text-muted text-center py-4">
          Select {SQUAD_SIZE} players from the pool
        </p>
      )}
    </div>
  );
}
