import Image from "next/image";
import { cn } from "@/lib/utils";
import { getJersey, type JerseyId } from "@/lib/jerseys";

const sizeClasses = {
  sm: "h-10 w-10",
  md: "h-14 w-14",
  lg: "h-16 w-16",
} as const;

interface JerseyIconProps {
  jerseyId?: JerseyId | null;
  className?: string;
  size?: keyof typeof sizeClasses;
}

export function JerseyIcon({ jerseyId, className, size = "md" }: JerseyIconProps) {
  const jersey = getJersey(jerseyId);

  return (
    <div className={cn("relative shrink-0", sizeClasses[size], className)}>
      <Image
        src={jersey.image}
        alt={jersey.label}
        fill
        sizes="64px"
        className="object-contain drop-shadow-sm"
      />
    </div>
  );
}
