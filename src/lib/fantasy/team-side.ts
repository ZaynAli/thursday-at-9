import { SESSION_TEAM_TO_DB_SIDE } from "@/lib/session-formats";

export function uiTeamToDbSide(team: "white" | "color"): "a" | "b" {
  return SESSION_TEAM_TO_DB_SIDE[team];
}

export function dbSideToUiTeam(side: "a" | "b"): "white" | "color" {
  return side === "a" ? "white" : "color";
}
