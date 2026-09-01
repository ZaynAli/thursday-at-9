"use client";

import { useMemo, useState } from "react";
import type { PlayerSeasonStats } from "@/types";
import { usePlayerLookup } from "@/context/AppSessionContext";
import { cn } from "@/lib/utils";

type SortKey = keyof Pick<
  PlayerSeasonStats,
  | "appearances"
  | "goals"
  | "assists"
  | "defensiveStops"
  | "wins"
  | "fantasyPointsGenerated"
>;

interface PlayerStatsTableProps {
  stats: PlayerSeasonStats[];
  className?: string;
}

const sortOptions: { key: SortKey; label: string; short: string }[] = [
  { key: "fantasyPointsGenerated", label: "Fantasy Pts", short: "Pts" },
  { key: "goals", label: "Goals", short: "G" },
  { key: "assists", label: "Assists", short: "A" },
  { key: "defensiveStops", label: "Stops", short: "DS" },
  { key: "wins", label: "Wins", short: "W" },
  { key: "appearances", label: "Apps", short: "App" },
];

export function PlayerStatsTable({ stats, className }: PlayerStatsTableProps) {
  const playerLookup = usePlayerLookup();
  const [sortKey, setSortKey] = useState<SortKey>("fantasyPointsGenerated");

  const sorted = useMemo(() => {
    return [...stats].sort((a, b) => b[sortKey] - a[sortKey]);
  }, [stats, sortKey]);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Mobile sort chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 sm:hidden">
        {sortOptions.map(({ key, short }) => (
          <button
            key={key}
            onClick={() => setSortKey(key)}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
              sortKey === key
                ? "bg-lime/15 text-lime border border-lime/30"
                : "bg-surface-elevated text-text-muted border border-border"
            )}
          >
            {short}
          </button>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block surface-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-xs text-text-muted uppercase tracking-wider">
              <th className="py-3 pl-4 text-left font-medium">Player</th>
              {sortOptions.map(({ key, label }) => (
                <th key={key} className="py-3 text-right font-medium">
                  <button
                    onClick={() => setSortKey(key)}
                    className={cn(
                      "hover:text-text-secondary transition-colors",
                      sortKey === key && "text-lime"
                    )}
                  >
                    {label}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((s) => {
              const player = playerLookup.get(s.playerId);
              if (!player) return null;
              return (
                <tr
                  key={s.playerId}
                  className="border-b border-border/50 hover:bg-surface-hover/50"
                >
                  <td className="py-3 pl-4 font-medium text-sm">{player.name}</td>
                  {sortOptions.map(({ key }) => (
                    <td
                      key={key}
                      className={cn(
                        "py-3 text-right tabular-nums text-sm",
                        sortKey === key ? "text-lime font-semibold" : "text-text-secondary"
                      )}
                    >
                      {s[key]}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-2">
        {sorted.map((s) => {
          const player = playerLookup.get(s.playerId);
          if (!player) return null;
          return (
            <div key={s.playerId} className="surface-card p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm">{player.name}</span>
                <span className="text-lime font-bold tabular-nums text-sm">
                  {s.fantasyPointsGenerated} pts
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2 text-center">
                {sortOptions.slice(1).map(({ key, short }) => (
                  <div key={key}>
                    <div className="text-[10px] text-text-muted uppercase">{short}</div>
                    <div className="text-sm tabular-nums font-medium">{s[key]}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
