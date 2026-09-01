import { formatPrice } from "@/lib/fantasy/pricing";
import { cn } from "@/lib/utils";

interface PlayerPriceProps {
  price: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "text-xs",
  md: "text-sm font-semibold",
  lg: "text-base font-bold tabular-nums",
};

export function PlayerPrice({ price, size = "md", className }: PlayerPriceProps) {
  return (
    <span className={cn("text-lime tabular-nums", sizeClasses[size], className)}>
      {formatPrice(price)}
    </span>
  );
}
