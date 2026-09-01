import type { Player, Profile } from "@/types";
import { PlayerPrice } from "@/components/shared/PlayerPrice";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ProfileHeaderProps {
  profile: Profile;
  linkedPlayer?: Player;
  className?: string;
}

function profileRoleLabel(profile: Profile): string | null {
  if (profile.isFantasyManager && profile.playerId) return "Player & Manager";
  if (profile.isFantasyManager) return "Fantasy Manager";
  if (profile.playerId) return "Player";
  return null;
}

export function ProfileHeader({ profile, linkedPlayer, className }: ProfileHeaderProps) {
  const player = linkedPlayer;
  const role = profileRoleLabel(profile);

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div
        className="h-16 w-16 rounded-full flex items-center justify-center text-xl font-bold ring-2 ring-white/10"
        style={{
          backgroundColor: `${profile.avatarColor}33`,
          color: profile.avatarColor,
        }}
      >
        {profile.initials}
      </div>
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-bold tracking-tight">{profile.name}</h1>
          {role && (
            <Badge
              variant="outline"
              className="text-[10px] border-border text-text-muted font-normal"
            >
              {role}
            </Badge>
          )}
        </div>
        {player && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-text-muted">Fantasy Price</span>
            <PlayerPrice price={player.price} size="md" />
          </div>
        )}
      </div>
    </div>
  );
}
