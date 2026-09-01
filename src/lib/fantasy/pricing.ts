import { SKILL_LEVEL_PRICES } from "@/lib/constants";
import type { SkillLevel } from "@/types";

export function getPlayerPrice(skillLevel: SkillLevel): number {
  return SKILL_LEVEL_PRICES[skillLevel];
}

export function formatPrice(price: number): string {
  return `$${price.toFixed(1)}m`;
}

export function getSkillLevelFromPrice(price: number): SkillLevel | null {
  const entry = Object.entries(SKILL_LEVEL_PRICES).find(
    ([, p]) => p === price
  );
  return entry ? (Number(entry[0]) as SkillLevel) : null;
}
