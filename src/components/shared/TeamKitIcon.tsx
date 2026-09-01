import { cn } from "@/lib/utils";
import type { TeamKitId } from "@/lib/team-kits";

const sizeClasses = {
  sm: "h-10 w-10",
  md: "h-14 w-14",
  lg: "h-16 w-16",
} as const;

interface TeamKitIconProps {
  kitId: TeamKitId;
  className?: string;
  size?: keyof typeof sizeClasses;
}

const KIT_STYLES: Record<
  TeamKitId,
  { body: string; trim: string; accent?: string }
> = {
  white: {
    body: "fill-zinc-100",
    trim: "stroke-zinc-400",
  },
  black: {
    body: "fill-zinc-900",
    trim: "stroke-zinc-500",
  },
  colors: {
    body: "fill-sky-500",
    trim: "stroke-sky-300",
    accent: "fill-lime-500",
  },
};

export function TeamKitIcon({ kitId, className, size = "md" }: TeamKitIconProps) {
  const styles = KIT_STYLES[kitId];

  return (
    <div className={cn("relative shrink-0", sizeClasses[size], className)}>
      <svg viewBox="0 0 48 48" className="h-full w-full drop-shadow-sm" aria-hidden>
        <path
          d="M14 8 L20 14 L24 12 L28 14 L34 8 L38 12 L34 18 L34 40 L14 40 L14 18 Z"
          className={cn(styles.body, styles.trim)}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {kitId === "colors" && (
          <>
            <path d="M18 22 H30 V28 H18 Z" className="fill-rose-500" />
            <path d="M18 30 H30 V36 H18 Z" className="fill-amber-400" />
          </>
        )}
        <path
          d="M20 14 L24 17 L28 14"
          className={cn(styles.trim)}
          fill="none"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
