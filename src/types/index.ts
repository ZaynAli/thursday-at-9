import type { JerseyId } from "@/lib/jerseys";

export type InviteStatus = "pending" | "accepted" | "expired";

export type { JerseyId };

/** Invite for a roster player to sign up as profile + fantasy manager */
export interface ManagerInvite {
  id: string;
  playerId: string;
  playerName: string;
  status: InviteStatus;
  token: string;
  inviteUrl: string;
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string;
}

export interface GameweekNotification {
  id: string;
  gameweekId: string;
  gameweekNumber: number;
  sentAt: string;
  sentByName: string;
  recipientCount: number;
  message: string;
}

export type SkillLevel = 1 | 2 | 3 | 4 | 5;

export type GameweekStatus =
  | "draft"
  | "pool_open"
  | "selection_open"
  | "selection_locked"
  | "in_progress"
  | "results_pending"
  | "published";

export interface Player {
  id: string;
  name: string;
  initials: string;
  skillLevel: SkillLevel;
  price: number;
  isActive: boolean;
  /** Linked app user, if this player has signed up */
  profileId?: string;
  form: number;
  lastGameweekPoints: number;
  seasonFantasyPoints: number;
  ownershipPercent: number;
  appearances: number;
  goals: number;
  assists: number;
  defensiveStops: number;
  wins: number;
}

export interface Profile {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  isAdmin: boolean;
  /** Picks a weekly fantasy team */
  isFantasyManager: boolean;
  /** Signed-in email — from auth session, not stored on profiles */
  email?: string;
  /** Jersey shown on the fantasy formation view */
  jerseyId: JerseyId;
  /** Linked real soccer player record, if they play */
  playerId?: string;
  /** Fantasy manager stats — present when isFantasyManager is true */
  managerRank?: number;
  totalFantasyPoints?: number;
  averageGameweekPoints?: number;
  bestGameweek?: number;
  bestGameweekNumber?: number;
  captainPointsTotal?: number;
  captainPickRate?: number;
  recentGameweekPoints?: number[];
  recentGameweekNumbers?: number[];
}

export type GameFormat = "5v5" | "6v6" | "7v7" | "8v8" | "9v9";

export interface Gameweek {
  id: string;
  number: number;
  date: string;
  gameTime: string;
  fantasyDeadline: string;
  status: GameweekStatus;
  availablePlayerIds: string[];
  format: GameFormat;
  teamWhiteName?: string;
  teamColorName?: string;
  teamAssignments?: Record<string, "white" | "color">;
}

export interface MatchResult {
  teamWhiteScore: number;
  teamColorScore: number;
  highestScorerId: string;
  highestScorerPoints: number;
}

export interface PlayerGameweekStats {
  playerId: string;
  gameweekId: string;
  appeared: boolean;
  team: "white" | "color";
  won: boolean;
  drew: boolean;
  goals: number;
  assists: number;
  defensiveStops: number;
}

export interface FantasyScore {
  managerId: string;
  gameweekId: string;
  points: number;
  rank?: number;
  rankMovement?: number;
}

export interface FantasySelection {
  playerId: string;
  isCaptain: boolean;
}

export interface FantasyTeam {
  managerId: string;
  gameweekId: string;
  selections: FantasySelection[];
  submittedAt?: string;
}

export interface LeagueStanding {
  rank: number;
  managerId: string;
  managerName: string;
  currentGameweekPoints: number;
  seasonPoints: number;
  rankMovement: number;
  isCurrentUser?: boolean;
}

export interface PlayerSeasonStats {
  playerId: string;
  appearances: number;
  goals: number;
  assists: number;
  defensiveStops: number;
  wins: number;
  fantasyPointsGenerated: number;
}

export interface GameweekRecap {
  gameweekNumber: number;
  finalScore: string;
  highestScorerName: string;
  highestScorerPoints: number;
  userGameweekPoints: number;
  userRankMovement: number;
}

export type SortField = "form" | "price" | "totalPoints" | "ownership";
export type SortDirection = "asc" | "desc";

export interface AdminGameweekDraft {
  number: number;
  date: string;
  fantasyDeadline: string;
  selectedPlayerIds: string[];
  status: GameweekStatus;
}
