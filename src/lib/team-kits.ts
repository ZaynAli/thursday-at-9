/** Session team kits — not player favorite club jerseys */

export type TeamKitId = "white" | "black" | "colors";

export interface TeamKit {
  id: TeamKitId;
  label: string;
  image: string;
}

const KITS: Record<TeamKitId, TeamKit> = {
  white: { id: "white", label: "White", image: "/white.png" },
  black: { id: "black", label: "Black", image: "/black.png" },
  colors: { id: "colors", label: "Colours", image: "/red.png" },
};

export function getTeamKit(id: TeamKitId): TeamKit {
  return KITS[id];
}

/** Team A kit from admin-entered name (White or Black presets). */
export function resolveTeamAKit(teamAName: string): TeamKitId {
  if (teamAName.trim().toLowerCase().includes("black")) return "black";
  return "white";
}

/** Team B is always the coloured bibs side. */
export function resolveTeamBKit(): TeamKitId {
  return "colors";
}

export function resolveSessionTeamKit(
  sessionTeam: "white" | "color",
  teamWhiteName: string
): TeamKitId {
  return sessionTeam === "white" ? resolveTeamAKit(teamWhiteName) : resolveTeamBKit();
}
