"use client";

import { useRouter } from "next/navigation";
import type { LeagueStanding } from "@/types";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, ChevronRight } from "lucide-react";

interface LeagueTableProps {
  standings: LeagueStanding[];
  className?: string;
}

export function LeagueTable({ standings, className }: LeagueTableProps) {
  const router = useRouter();

  return (
    <div className={cn("surface-card overflow-hidden", className)}>
      {/* Desktop table */}
      <div className="hidden sm:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-[10px] text-text-muted uppercase tracking-wider">
              <th className="py-3 pl-4 text-left font-medium w-10">#</th>
              <th className="py-3 text-left font-medium">Manager</th>
              <th className="py-3 text-right font-medium pr-3">GW</th>
              <th className="py-3 text-right font-medium pr-4">Total</th>
              <th className="py-3 w-8" />
            </tr>
          </thead>
          <tbody>
            {standings.map((s, i) => (
              <tr
                key={s.managerId}
                role="link"
                tabIndex={0}
                onClick={() => router.push(`/league/${s.managerId}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(`/league/${s.managerId}`);
                  }
                }}
                className={cn(
                  "border-b border-border/50 transition-colors cursor-pointer group",
                  "hover:bg-surface-hover/50",
                  s.isCurrentUser && "bg-lime/5",
                  i === 0 && "border-l-2 border-l-gold",
                  i === 1 && "border-l-2 border-l-zinc-400",
                  i === 2 && "border-l-2 border-l-amber-700"
                )}
              >
                <td className="py-3.5 pl-4">
                  <RankCell rank={s.rank} movement={s.rankMovement} />
                </td>
                <td className="py-3.5">
                  <span
                    className={cn(
                      "font-medium text-sm group-hover:text-lime transition-colors",
                      s.isCurrentUser ? "text-lime" : "text-text-primary"
                    )}
                  >
                    {s.managerName}
                  </span>
                </td>
                <td className="py-3.5 text-right tabular-nums text-sm text-text-secondary pr-3">
                  {s.currentGameweekPoints}
                </td>
                <td className="py-3.5 pr-4 text-right tabular-nums text-sm font-semibold">
                  {s.seasonPoints}
                </td>
                <td className="py-3.5 pr-3">
                  <ChevronRight className="h-3.5 w-3.5 text-text-muted/40 group-hover:text-text-muted transition-colors" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden divide-y divide-border">
        {standings.map((s, i) => (
          <button
            key={s.managerId}
            type="button"
            onClick={() => router.push(`/league/${s.managerId}`)}
            className={cn(
              "flex items-center gap-3 px-4 py-3.5 transition-colors w-full text-left",
              "active:bg-surface-hover/50",
              s.isCurrentUser && "bg-lime/5",
              i === 0 && "border-l-2 border-l-gold",
              i === 1 && "border-l-2 border-l-zinc-400",
              i === 2 && "border-l-2 border-l-amber-700"
            )}
          >
            <RankCell rank={s.rank} movement={s.rankMovement} />
            <span
              className={cn(
                "flex-1 font-medium text-sm",
                s.isCurrentUser ? "text-lime" : "text-text-primary"
              )}
            >
              {s.managerName}
            </span>
            <div className="text-right mr-1">
              <div className="text-sm tabular-nums font-semibold">{s.seasonPoints}</div>
              <div className="text-[10px] tabular-nums text-text-muted">
                GW {s.currentGameweekPoints}
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-text-muted/40 shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}

function RankCell({ rank, movement }: { rank: number; movement: number }) {
  const rankColors: Record<number, string> = {
    1: "text-gold",
    2: "text-zinc-400",
    3: "text-amber-700",
  };

  return (
    <div className="flex items-center gap-1.5 min-w-[2.5rem]">
      <span
        className={cn(
          "text-sm font-bold tabular-nums w-5 text-right",
          rankColors[rank] ?? "text-text-muted"
        )}
      >
        {rank}
      </span>
      <MovementIcon movement={movement} />
    </div>
  );
}

function MovementIcon({ movement }: { movement: number }) {
  if (movement > 0)
    return <TrendingUp className="h-3 w-3 text-lime" />;
  if (movement < 0)
    return <TrendingDown className="h-3 w-3 text-danger" />;
  return <Minus className="h-3 w-3 text-text-muted/30" />;
}
