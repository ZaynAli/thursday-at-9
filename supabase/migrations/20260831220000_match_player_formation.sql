-- Formation slot index per player on the match pitch (0-based per team side).
ALTER TABLE public.match_players
  ADD COLUMN IF NOT EXISTS position_index SMALLINT;

ALTER TABLE public.match_players
  DROP CONSTRAINT IF EXISTS match_players_position_index_check;

ALTER TABLE public.match_players
  ADD CONSTRAINT match_players_position_index_check
  CHECK (position_index IS NULL OR (position_index >= 0 AND position_index < 9));

CREATE UNIQUE INDEX IF NOT EXISTS match_players_match_side_slot_idx
  ON public.match_players (match_id, team_side, position_index)
  WHERE position_index IS NOT NULL;
