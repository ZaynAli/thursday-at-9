"use client";

import { useMemo, useState } from "react";
import type { Player, SortField, SortDirection } from "@/types";
import { PlayerRow } from "./PlayerRow";
import { Button } from "@/components/ui/button";
import { PRICE_FILTERS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { ArrowUpDown } from "lucide-react";

interface FantasyPlayerPoolProps {
  players: Player[];
  isSelected: (id: string) => boolean;
  isCaptain: (id: string) => boolean;
  canAdd: (player: Player) => boolean;
  getUnaffordableReason: (player: Player) => string | null;
  onToggle: (id: string) => void;
  onPlayerSelect: (player: Player) => void;
  variant?: "desktop" | "mobile";
}

const sortOptions: { field: SortField; label: string }[] = [
  { field: "form", label: "Form" },
  { field: "price", label: "Price" },
  { field: "totalPoints", label: "Points" },
  { field: "ownership", label: "Owned" },
];

export function FantasyPlayerPool({
  players,
  isSelected,
  isCaptain,
  canAdd,
  getUnaffordableReason,
  onToggle,
  onPlayerSelect,
  variant = "desktop",
}: FantasyPlayerPoolProps) {
  const [priceFilter, setPriceFilter] = useState<number | "all">("all");
  const [sortField, setSortField] = useState<SortField>("form");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");

  const filtered = useMemo(() => {
    let result = [...players];
    if (priceFilter !== "all") {
      result = result.filter((p) => p.price === priceFilter);
    }
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "form":
          cmp = a.form - b.form;
          break;
        case "price":
          cmp = a.price - b.price;
          break;
        case "totalPoints":
          cmp = a.seasonFantasyPoints - b.seasonFantasyPoints;
          break;
        case "ownership":
          cmp = a.ownershipPercent - b.ownershipPercent;
          break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
    return result;
  }, [players, priceFilter, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <FilterChip
          active={priceFilter === "all"}
          onClick={() => setPriceFilter("all")}
        >
          All
        </FilterChip>
        {PRICE_FILTERS.map((price) => (
          <FilterChip
            key={price}
            active={priceFilter === price}
            onClick={() => setPriceFilter(price)}
          >
            ${price}m
          </FilterChip>
        ))}
      </div>

      {/* Sort (mobile) */}
      {variant === "mobile" && (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {sortOptions.map(({ field, label }) => (
            <FilterChip
              key={field}
              active={sortField === field}
              onClick={() => toggleSort(field)}
            >
              {label}
              {sortField === field && (
                <ArrowUpDown className="h-3 w-3 ml-1 inline" />
              )}
            </FilterChip>
          ))}
        </div>
      )}

      {variant === "desktop" ? (
        <div className="surface-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-xs text-text-muted uppercase tracking-wider">
                <th className="py-3 pl-4 text-left font-medium">Player</th>
                <th className="py-3 text-right font-medium">
                  <button onClick={() => toggleSort("price")} className="hover:text-text-secondary">
                    Price
                  </button>
                </th>
                <th className="py-3 text-right font-medium">
                  <button onClick={() => toggleSort("form")} className="hover:text-text-secondary">
                    Form
                  </button>
                </th>
                <th className="py-3 text-right font-medium">
                  <button onClick={() => toggleSort("totalPoints")} className="hover:text-text-secondary">
                    Last GW
                  </button>
                </th>
                <th className="py-3 text-right font-medium">
                  <button onClick={() => toggleSort("ownership")} className="hover:text-text-secondary">
                    Owned
                  </button>
                </th>
                <th className="py-3 pr-4" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((player) => (
                <PlayerRow
                  key={player.id}
                  player={player}
                  isSelected={isSelected(player.id)}
                  isCaptain={isCaptain(player.id)}
                  canAdd={canAdd(player)}
                  unaffordableReason={getUnaffordableReason(player)}
                  onToggle={() => onToggle(player.id)}
                  onSelect={() => onPlayerSelect(player)}
                  variant="desktop"
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((player) => (
            <PlayerRow
              key={player.id}
              player={player}
              isSelected={isSelected(player.id)}
              isCaptain={isCaptain(player.id)}
              canAdd={canAdd(player)}
              unaffordableReason={getUnaffordableReason(player)}
              onToggle={() => onToggle(player.id)}
              onSelect={() => onPlayerSelect(player)}
              variant="mobile"
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
        active
          ? "bg-lime/15 text-lime border border-lime/30"
          : "bg-surface-elevated text-text-muted border border-border hover:text-text-secondary"
      )}
    >
      {children}
    </button>
  );
}
