import type { Profile } from "@/types";
import { cn } from "@/lib/utils";

interface RecentFormProps {
  profile: Profile;
  className?: string;
}

export function RecentForm({ profile, className }: RecentFormProps) {
  const recentGameweekPoints = profile.recentGameweekPoints ?? [];
  const recentGameweekNumbers = profile.recentGameweekNumbers ?? [];

  if (recentGameweekPoints.length === 0) return null;

  const max = Math.max(...recentGameweekPoints, 1);

  return (
    <div className={cn("surface-card p-4", className)}>
      <h3 className="text-xs font-semibold tracking-[0.15em] text-text-muted uppercase mb-4">
        Recent Gameweeks
      </h3>

      <div className="flex items-end gap-2 h-24">
        {recentGameweekPoints.map((pts, i) => {
          const height = (pts / max) * 100;
          const isLatest = i === recentGameweekPoints.length - 1;
          return (
            <div key={recentGameweekNumbers[i]} className="flex-1 flex flex-col items-center gap-1">
              <span
                className={cn(
                  "text-[10px] tabular-nums font-medium",
                  isLatest ? "text-lime" : "text-text-muted"
                )}
              >
                {pts}
              </span>
              <div className="w-full flex items-end justify-center h-16">
                <div
                  className={cn(
                    "w-full max-w-[32px] rounded-t transition-all",
                    isLatest ? "bg-lime" : "bg-surface-hover"
                  )}
                  style={{ height: `${height}%`, minHeight: "4px" }}
                />
              </div>
              <span className="text-[9px] text-text-muted tabular-nums">
                GW{recentGameweekNumbers[i]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
