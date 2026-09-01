import type { GameFormat, GameweekStatus, InviteStatus } from "@/types";

export interface PlayerRow {
  id: string;
  name: string;
  skill_level: number;
  is_active: boolean;
  profile_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileRow {
  id: string;
  display_name: string;
  initials: string | null;
  avatar_color: string | null;
  is_admin: boolean;
  is_fantasy_manager: boolean;
  player_id: string | null;
  jersey_id: string;
  created_at: string;
  updated_at: string;
}

export interface GameweekRow {
  id: string;
  season_id: string;
  number: number;
  scheduled_at: string;
  fantasy_deadline: string;
  status: GameweekStatus;
  format: GameFormat;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MatchRow {
  id: string;
  gameweek_id: string;
  team_a_name: string;
  team_b_name: string;
  team_a_score: number | null;
  team_b_score: number | null;
}

export interface MatchPlayerRow {
  player_id: string;
  team_side: "a" | "b";
  position_index: number | null;
}

export interface InviteRow {
  id: string;
  player_id: string;
  token: string;
  status: InviteStatus;
  created_by: string | null;
  expires_at: string;
  accepted_at: string | null;
  accepted_profile_id: string | null;
  created_at: string;
}
