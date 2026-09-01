import type { LeagueStanding } from "@/types";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface LeagueTableProps {
  standings: LeagueStanding[];
  className?: string;
}

export function LeagueTable({ standings, className }: LeagueTableProps) {
  return (
    <div className={cn("surface-card overflow-hidden", className)}>
      {/* Desktop table */}
      <div className="hidden sm:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-xs text-text-muted uppercase tracking-wider">
              <th className="py-3 pl-4 text-left font-medium w-12">#</th>
              <th className="py-3 text-left font-medium">Manager</th>
              <th className="py-3 text-right font-medium">GW</th>
              <th className="py-3 pr-4 text-right font-medium">Season</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((s) => (
              <tr
                key={s.managerId}
                className={cn(
                  "border-b border-border/50 transition-colors",
                  s.isCurrentUser && "bg-lime/5"
                )}
              >
                <td className="py-3 pl-4">
                  <RankCell rank={s.rank} movement={s.rankMovement} />
                </td>
                <td className="py-3">
                  <span
                    className={cn(
                      "font-medium text-sm",
                      s.isCurrentUser ? "text-lime" : "text-text-primary"
                    )}
                  >
                    {s.managerName}
                  </span>
                </td>
                <td className="py-3 text-right tabular-nums text-sm text-text-secondary">
                  {s.currentGameweekPoints}
                </td>
                <td className="py-3 pr-4 text-right tabular-nums text-sm font-semibold">
                  {s.seasonPoints}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden divide-y divide-border">
        {standings.map((s) => (
          <div
            key={s.managerId}
            className={cn(
              "flex items-center gap-3 px-4 py-3.5",
              s.isCurrentUser && "bg-lime/5"
            )}
          >
            <RankCell rank={s.rank} movement={s.rankMovement} />
            <span
              className={cn(
                "flex-1 font-medium",
                s.isCurrentUser ? "text-lime" : "text-text-primary"
              )}
            >
              {s.managerName}
            </span>
            <div className="text-right">
              <div className="text-sm tabular-nums font-semibold">{s.seasonPoints}</div>
              <div className="text-xs tabular-nums text-text-muted">
                GW {s.currentGameweekPoints}
              </div>
            </div>
          </div>
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
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "text-sm font-bold tabular-nums w-5",
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
  return <Minus className="h-3 w-3 text-text-muted/50" />;
}
