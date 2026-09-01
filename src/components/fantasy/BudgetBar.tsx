"use client";

import { FANTASY_BUDGET, SQUAD_SIZE } from "@/lib/constants";
import { formatPrice } from "@/lib/fantasy/pricing";
import { cn } from "@/lib/utils";

interface BudgetBarProps {
  selectedCount: number;
  budgetRemaining: number;
  squadCost: number;
  animated?: boolean;
  compact?: boolean;
  className?: string;
}

export function BudgetBar({
  selectedCount,
  budgetRemaining,
  squadCost,
  animated = true,
  compact = false,
  className,
}: BudgetBarProps) {
  const spentPercent = (squadCost / FANTASY_BUDGET) * 100;
  const isOverBudget = budgetRemaining < 0;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-text-muted">
          <span className="font-semibold text-text-primary tabular-nums">
            {selectedCount}
          </span>
          <span className="text-text-muted"> / {SQUAD_SIZE}</span>
        </span>
        <span
          className={cn(
            "font-semibold tabular-nums",
            isOverBudget ? "text-danger" : "text-lime"
          )}
        >
          {formatPrice(Math.max(0, budgetRemaining))} remaining
        </span>
      </div>

      <div className="relative h-1.5 rounded-full bg-surface overflow-hidden">
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full",
            animated && "transition-all duration-300 ease-out",
            isOverBudget
              ? "bg-danger"
              : spentPercent > 85
                ? "bg-gold"
                : "bg-lime"
          )}
          style={{ width: `${Math.min(100, spentPercent)}%` }}
        />
      </div>

      {!compact && (
        <div className="flex justify-between text-[10px] text-text-muted tabular-nums">
          <span>{formatPrice(squadCost)} spent</span>
          <span>{formatPrice(FANTASY_BUDGET)} budget</span>
        </div>
      )}
    </div>
  );
}
