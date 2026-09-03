import type { Gameweek, GameweekRecap, TeamFormation } from "@/types";
import { buildDefaultFormation } from "@/lib/formations";

export const CURRENT_GAMEWEEK_ID = "gw-8";

/** 14 players selected for GW08 (7v7). Full roster has 18; 4 sit out this week. */
export const GW08_PLAYER_IDS = [
  "jimmy",
  "ramis",
  "osama",
  "ibrahim-o",
  "zain",
  "shaafay",
  "shahrukh",
  "ibtehaj",
  "taha",
  "nikhil",
  "owais",
  "zahin",
  "abdul",
  "ibrahim",
] as const;

/** Roster players not selected for GW08 */
export const GW08_SITTING_OUT = ["hassan", "faraz", "ali", "usman"] as const;

export const mockGameweeks: Gameweek[] = [
  {
    id: "gw-8",
    number: 8,
    date: "2026-08-29T01:30:00.000Z",
    gameTime: "9:30 PM",
    fantasyDeadline: "2026-08-29T01:30:00.000Z",
    status: "selection_open",
    format: "7v7",
    teamWhiteName: "White",
    teamColorName: "Colours",
    teamAssignments: {
      jimmy: "white",
      ramis: "white",
      osama: "white",
      "ibrahim-o": "white",
      zain: "white",
      shaafay: "white",
      shahrukh: "white",
      ibtehaj: "color",
      taha: "color",
      nikhil: "color",
      owais: "color",
      zahin: "color",
      abdul: "color",
      ibrahim: "color",
    },
    teamFormation: buildDefaultFormation(
      {
        jimmy: "white",
        ramis: "white",
        osama: "white",
        "ibrahim-o": "white",
        zain: "white",
        shaafay: "white",
        shahrukh: "white",
        ibtehaj: "color",
        taha: "color",
        nikhil: "color",
        owais: "color",
        zahin: "color",
        abdul: "color",
        ibrahim: "color",
      },
      "7v7"
    ) satisfies TeamFormation,
    availablePlayerIds: [...GW08_PLAYER_IDS],
  },
];

export function getCurrentGameweek(): Gameweek {
  return mockGameweeks.find((gw) => gw.id === CURRENT_GAMEWEEK_ID)!;
}

export const mockLatestRecap: GameweekRecap = {
  gameweekNumber: 7,
  finalScore: "White 4 – 3 Colours",
  highestScorerName: "Ramis",
  highestScorerPoints: 22,
  userGameweekPoints: 18,
  userRankMovement: 1,
};
