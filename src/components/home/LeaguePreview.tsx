import Link from "next/link";
import type { LeagueStanding } from "@/types";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface LeaguePreviewProps {
  standings: LeagueStanding[];
  currentUserRank: number;
  className?: string;
}

function RankBadge({ rank }: { rank: number }) {
  const colors: Record<number, string> = {
    1: "text-gold",
    2: "text-text-secondary",
    3: "text-amber-700",
  };
  return (
    <span
      className={cn(
        "text-sm font-bold tabular-nums w-5",
        colors[rank] ?? "text-text-muted"
      )}
    >
      {rank}
    </span>
  );
}

export function LeaguePreview({
  standings,
  currentUserRank,
  className,
}: LeaguePreviewProps) {
  const top3 = standings.slice(0, 3);
  const userInTop3 = top3.some((s) => s.isCurrentUser);
  const userStanding = standings.find((s) => s.isCurrentUser);

  return (
    <div className={cn("surface-card p-4", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold tracking-[0.15em] text-text-muted uppercase">
          League
        </h3>
        <Link
          href="/league"
          className="text-xs text-lime hover:text-lime-muted flex items-center gap-0.5 transition-colors"
        >
          View all
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="space-y-2.5">
        {top3.map((s) => (
          <StandingRow key={s.managerId} standing={s} />
        ))}
        {!userInTop3 && userStanding && (
          <>
            <div className="border-t border-border my-2" />
            <StandingRow standing={userStanding} />
          </>
        )}
      </div>
    </div>
  );
}

function StandingRow({ standing }: { standing: LeagueStanding }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 py-1",
        standing.isCurrentUser && "bg-lime/5 -mx-2 px-2 rounded-md"
      )}
    >
      <RankBadge rank={standing.rank} />
      <span
        className={cn(
          "flex-1 text-sm font-medium",
          standing.isCurrentUser ? "text-lime" : "text-text-primary"
        )}
      >
        {standing.managerName}
      </span>
      <span className="text-sm tabular-nums text-text-secondary">
        {standing.seasonPoints}
      </span>
    </div>
  );
}
