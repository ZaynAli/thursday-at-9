/** Central league configuration — single source of truth for business rules */

export const GAME_TIME = {
  dayOfWeek: 4, // Thursday (0 = Sunday)
  hour: 21,
  minute: 30,
  label: "9:30 PM",
  dayLabel: "Thursday",
} as const;

export const DEFAULT_FANTASY_DEADLINE = {
  dayOfWeek: 4,
  hour: 20,
  minute: 30,
  label: "8:30 PM",
} as const;

export const SQUAD_SIZE = 5;
export const FANTASY_BUDGET = 35;
export const DEFENSIVE_STOP_SCORING_CAP = 3;

export const SKILL_LEVEL_PRICES: Record<1 | 2 | 3 | 4 | 5, number> = {
  1: 4.0,
  2: 5.5,
  3: 7.0,
  4: 8.5,
  5: 10.0,
};

export const FANTASY_SCORING = {
  appearance: 2,
  win: 3,
  draw: 1,
  goal: 4,
  assist: 3,
  defensiveStop: 2,
} as const;

export const PRICE_FILTERS = [10.0, 8.5, 7.0, 5.5, 4.0] as const;

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1440,
} as const;

export const FANTASY_STORAGE_KEY = "930-league-fantasy-team";

export const LEAGUE_NAME = "Thursday@9";
