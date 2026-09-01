import { cn } from "@/lib/utils";

interface CaptainBadgeProps {
  size?: "sm" | "md";
  className?: string;
}

export function CaptainBadge({ size = "sm", className }: CaptainBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded font-bold bg-gold text-background",
        size === "sm" ? "h-4 w-4 text-[9px]" : "h-5 w-5 text-[10px]",
        className
      )}
    >
      C
    </span>
  );
}
