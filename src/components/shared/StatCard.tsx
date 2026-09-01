import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  highlight?: boolean;
  className?: string;
}

export function StatCard({
  label,
  value,
  subtext,
  highlight = false,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "surface-card p-4 flex flex-col gap-1 transition-colors",
        highlight && "border-lime/20 glow-lime-sm",
        className
      )}
    >
      <span className="text-xs font-medium tracking-wide text-text-muted uppercase">
        {label}
      </span>
      <span
        className={cn(
          "text-2xl font-bold tabular-nums tracking-tight",
          highlight ? "text-lime" : "text-text-primary"
        )}
      >
        {value}
      </span>
      {subtext && (
        <span className="text-xs text-text-muted">{subtext}</span>
      )}
    </div>
  );
}
