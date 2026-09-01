import Image from "next/image";
import { cn } from "@/lib/utils";
import { getTeamKit, type TeamKitId } from "@/lib/team-kits";

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

export function TeamKitIcon({ kitId, className, size = "md" }: TeamKitIconProps) {
  const kit = getTeamKit(kitId);

  return (
    <div className={cn("relative shrink-0", sizeClasses[size], className)}>
      <Image
        src={kit.image}
        alt={kit.label}
        fill
        sizes="64px"
        className="object-contain drop-shadow-sm"
      />
    </div>
  );
}
