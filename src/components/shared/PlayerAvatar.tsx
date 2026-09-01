"use client";

import { cn } from "@/lib/utils";

interface PlayerAvatarProps {
  initials: string;
  color?: string;
  size?: "sm" | "md" | "lg";
  isCaptain?: boolean;
  className?: string;
}

const sizes = {
  sm: "h-8 w-8 text-[10px]",
  md: "h-10 w-10 text-xs",
  lg: "h-12 w-12 text-sm",
};

export function PlayerAvatar({
  initials,
  color = "#71717a",
  size = "md",
  isCaptain = false,
  className,
}: PlayerAvatarProps) {
  return (
    <div className={cn("relative shrink-0", className)}>
      <div
        className={cn(
          "rounded-full flex items-center justify-center font-semibold text-text-primary ring-1 ring-white/10",
          sizes[size],
          isCaptain && "ring-2 ring-gold"
        )}
        style={{ backgroundColor: `${color}33`, borderColor: color }}
      >
        {initials}
      </div>
      {isCaptain && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[9px] font-bold text-background">
          C
        </span>
      )}
    </div>
  );
}
