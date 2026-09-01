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

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function ProfileHeader({ profile, linkedPlayer, className }: ProfileHeaderProps) {
  const role = profileRoleLabel(profile);
  const displayName = linkedPlayer?.name ?? profile.name;
  const avatarInitials = linkedPlayer
    ? initialsFromName(linkedPlayer.name)
    : profile.initials;

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div
        className="h-16 w-16 rounded-full flex items-center justify-center text-xl font-bold ring-2 ring-white/10"
        style={{
          backgroundColor: `${profile.avatarColor}33`,
          color: profile.avatarColor,
        }}
      >
        {avatarInitials}
      </div>
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-bold tracking-tight">{displayName}</h1>
          {role && (
            <Badge
              variant="outline"
              className="text-[10px] border-border text-text-muted font-normal"
            >
              {role}
            </Badge>
          )}
        </div>
        {profile.email && (
          <p className="text-sm text-text-muted mt-0.5">{profile.email}</p>
        )}
        {linkedPlayer && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-text-muted">Fantasy Price</span>
            <PlayerPrice price={linkedPlayer.price} size="md" />
          </div>
        )}
      </div>
    </div>
  );
}
