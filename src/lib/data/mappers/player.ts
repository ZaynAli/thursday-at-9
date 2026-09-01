import { getPlayerPrice } from "@/lib/fantasy/pricing";
import type { PlayerRow } from "@/lib/data/db-types";
import type { Player, SkillLevel } from "@/types";

export function playerInitials(name: string): string {
  return name
    .split(/[\s.]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function mapPlayerRow(row: PlayerRow): Player {
  const skillLevel = row.skill_level as SkillLevel;
  return {
    id: row.id,
    name: row.name,
    initials: playerInitials(row.name),
    skillLevel,
    price: getPlayerPrice(skillLevel),
    isActive: row.is_active,
    profileId: row.profile_id ?? undefined,
    form: 5.0,
    lastGameweekPoints: 0,
    seasonFantasyPoints: 0,
    ownershipPercent: 0,
    appearances: 0,
    goals: 0,
    assists: 0,
    defensiveStops: 0,
    wins: 0,
  };
}
