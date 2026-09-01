-- Thursday@9 — initial schema (1.2)
-- Run in Supabase Dashboard → SQL Editor → New query → Run
-- Safe to re-run: uses IF NOT EXISTS / DROP POLICY IF EXISTS where needed

-- ---------------------------------------------------------------------------
-- Extensions & helpers
-- ---------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Tables (players before profiles — cross-link added after profiles)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  skill_level SMALLINT NOT NULL CHECK (skill_level BETWEEN 1 AND 5),
  is_active BOOLEAN NOT NULL DEFAULT true,
  profile_id UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  initials TEXT,
  avatar_color TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  is_fantasy_manager BOOLEAN NOT NULL DEFAULT false,
  player_id UUID NULL REFERENCES public.players (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT profiles_player_id_unique UNIQUE (player_id)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'players_profile_id_fkey'
  ) THEN
    ALTER TABLE public.players
      ADD CONSTRAINT players_profile_id_fkey
      FOREIGN KEY (profile_id) REFERENCES public.profiles (id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS players_profile_id_unique
  ON public.players (profile_id)
  WHERE profile_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gameweeks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES public.seasons (id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  fantasy_deadline TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (
    status IN (
      'draft',
      'selection_open',
      'selection_locked',
      'in_progress',
      'results_pending',
      'published'
    )
  ),
  format TEXT NOT NULL DEFAULT '7v7' CHECK (
    format IN ('5v5', '6v6', '7v7', '8v8', '9v9')
  ),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (season_id, number)
);

CREATE TABLE IF NOT EXISTS public.gameweek_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gameweek_id UUID NOT NULL REFERENCES public.gameweeks (id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (gameweek_id, player_id)
);

CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gameweek_id UUID NOT NULL UNIQUE REFERENCES public.gameweeks (id) ON DELETE CASCADE,
  team_a_name TEXT NOT NULL DEFAULT 'White',
  team_b_name TEXT NOT NULL DEFAULT 'Colours',
  team_a_score INTEGER,
  team_b_score INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.match_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches (id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players (id) ON DELETE CASCADE,
  team_side TEXT NOT NULL CHECK (team_side IN ('a', 'b')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (match_id, player_id)
);

CREATE TABLE IF NOT EXISTS public.player_gameweek_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gameweek_id UUID NOT NULL REFERENCES public.gameweeks (id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players (id) ON DELETE CASCADE,
  appeared BOOLEAN NOT NULL DEFAULT false,
  team_side TEXT CHECK (team_side IN ('a', 'b')),
  won BOOLEAN NOT NULL DEFAULT false,
  drew BOOLEAN NOT NULL DEFAULT false,
  goals INTEGER NOT NULL DEFAULT 0,
  assists INTEGER NOT NULL DEFAULT 0,
  defensive_stops INTEGER NOT NULL DEFAULT 0,
  fantasy_points INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (gameweek_id, player_id)
);

CREATE TABLE IF NOT EXISTS public.fantasy_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gameweek_id UUID NOT NULL REFERENCES public.gameweeks (id) ON DELETE CASCADE,
  manager_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  submitted_at TIMESTAMPTZ,
  total_points INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (gameweek_id, manager_id)
);

CREATE TABLE IF NOT EXISTS public.fantasy_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fantasy_team_id UUID NOT NULL REFERENCES public.fantasy_teams (id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players (id) ON DELETE CASCADE,
  is_captain BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (fantasy_team_id, player_id)
);

CREATE TABLE IF NOT EXISTS public.fantasy_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES public.seasons (id) ON DELETE CASCADE,
  manager_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  gameweek_id UUID NOT NULL REFERENCES public.gameweeks (id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  season_total INTEGER NOT NULL DEFAULT 0,
  rank INTEGER,
  rank_movement INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (season_id, manager_id, gameweek_id)
);

CREATE TABLE IF NOT EXISTS public.invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES public.players (id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'accepted', 'expired')
  ),
  created_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  accepted_profile_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gameweek_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gameweek_id UUID NOT NULL REFERENCES public.gameweeks (id) ON DELETE CASCADE,
  sent_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  recipient_count INTEGER NOT NULL DEFAULT 0,
  channel TEXT NOT NULL DEFAULT 'in_app' CHECK (
    channel IN ('in_app', 'push', 'email')
  )
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS profiles_is_fantasy_manager_idx
  ON public.profiles (is_fantasy_manager)
  WHERE is_fantasy_manager = true;

CREATE INDEX IF NOT EXISTS gameweeks_season_number_idx
  ON public.gameweeks (season_id, number);

CREATE INDEX IF NOT EXISTS gameweeks_format_idx
  ON public.gameweeks (format);

CREATE INDEX IF NOT EXISTS gameweek_players_gameweek_idx
  ON public.gameweek_players (gameweek_id);

CREATE INDEX IF NOT EXISTS match_players_match_side_idx
  ON public.match_players (match_id, team_side);

CREATE INDEX IF NOT EXISTS fantasy_teams_gameweek_manager_idx
  ON public.fantasy_teams (gameweek_id, manager_id);

CREATE INDEX IF NOT EXISTS player_gameweek_stats_gameweek_idx
  ON public.player_gameweek_stats (gameweek_id);

CREATE INDEX IF NOT EXISTS fantasy_scores_season_manager_idx
  ON public.fantasy_scores (season_id, manager_id);

CREATE INDEX IF NOT EXISTS invites_pending_player_idx
  ON public.invites (player_id, status)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS gameweek_notifications_gameweek_idx
  ON public.gameweek_notifications (gameweek_id);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

DROP TRIGGER IF EXISTS players_set_updated_at ON public.players;
CREATE TRIGGER players_set_updated_at
  BEFORE UPDATE ON public.players
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS seasons_set_updated_at ON public.seasons;
CREATE TRIGGER seasons_set_updated_at
  BEFORE UPDATE ON public.seasons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS gameweeks_set_updated_at ON public.gameweeks;
CREATE TRIGGER gameweeks_set_updated_at
  BEFORE UPDATE ON public.gameweeks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS matches_set_updated_at ON public.matches;
CREATE TRIGGER matches_set_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS player_gameweek_stats_set_updated_at ON public.player_gameweek_stats;
CREATE TRIGGER player_gameweek_stats_set_updated_at
  BEFORE UPDATE ON public.player_gameweek_stats
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS fantasy_teams_set_updated_at ON public.fantasy_teams;
CREATE TRIGGER fantasy_teams_set_updated_at
  BEFORE UPDATE ON public.fantasy_teams
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS fantasy_scores_set_updated_at ON public.fantasy_scores;
CREATE TRIGGER fantasy_scores_set_updated_at
  BEFORE UPDATE ON public.fantasy_scores
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Profile bootstrap on auth signup
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, initials)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1), 'Manager'),
    UPPER(LEFT(COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email, 'M'), 2))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Auth helper functions (after profiles table exists)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND is_admin = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_fantasy_manager()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND is_fantasy_manager = true
  );
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gameweeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gameweek_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_gameweek_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fantasy_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fantasy_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fantasy_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gameweek_notifications ENABLE ROW LEVEL SECURITY;

-- profiles
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
CREATE POLICY "profiles_select_authenticated"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
CREATE POLICY "profiles_admin_all"
  ON public.profiles FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- players
DROP POLICY IF EXISTS "players_select_authenticated" ON public.players;
CREATE POLICY "players_select_authenticated"
  ON public.players FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "players_admin_all" ON public.players;
CREATE POLICY "players_admin_all"
  ON public.players FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- seasons & gameweeks (read league data)
DROP POLICY IF EXISTS "seasons_select_authenticated" ON public.seasons;
CREATE POLICY "seasons_select_authenticated"
  ON public.seasons FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "seasons_admin_all" ON public.seasons;
CREATE POLICY "seasons_admin_all"
  ON public.seasons FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "gameweeks_select_authenticated" ON public.gameweeks;
CREATE POLICY "gameweeks_select_authenticated"
  ON public.gameweeks FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "gameweeks_admin_all" ON public.gameweeks;
CREATE POLICY "gameweeks_admin_all"
  ON public.gameweeks FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- session pool & match data
DROP POLICY IF EXISTS "gameweek_players_select_authenticated" ON public.gameweek_players;
CREATE POLICY "gameweek_players_select_authenticated"
  ON public.gameweek_players FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "gameweek_players_admin_all" ON public.gameweek_players;
CREATE POLICY "gameweek_players_admin_all"
  ON public.gameweek_players FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "matches_select_authenticated" ON public.matches;
CREATE POLICY "matches_select_authenticated"
  ON public.matches FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "matches_admin_all" ON public.matches;
CREATE POLICY "matches_admin_all"
  ON public.matches FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "match_players_select_authenticated" ON public.match_players;
CREATE POLICY "match_players_select_authenticated"
  ON public.match_players FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "match_players_admin_all" ON public.match_players;
CREATE POLICY "match_players_admin_all"
  ON public.match_players FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- stats & standings
DROP POLICY IF EXISTS "player_gameweek_stats_select_authenticated" ON public.player_gameweek_stats;
CREATE POLICY "player_gameweek_stats_select_authenticated"
  ON public.player_gameweek_stats FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "player_gameweek_stats_admin_all" ON public.player_gameweek_stats;
CREATE POLICY "player_gameweek_stats_admin_all"
  ON public.player_gameweek_stats FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "fantasy_scores_select_authenticated" ON public.fantasy_scores;
CREATE POLICY "fantasy_scores_select_authenticated"
  ON public.fantasy_scores FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "fantasy_scores_admin_all" ON public.fantasy_scores;
CREATE POLICY "fantasy_scores_admin_all"
  ON public.fantasy_scores FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- fantasy teams: managers manage own; all read after lock (simplified: managers read/write own always for now)
DROP POLICY IF EXISTS "fantasy_teams_select_authenticated" ON public.fantasy_teams;
CREATE POLICY "fantasy_teams_select_authenticated"
  ON public.fantasy_teams FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "fantasy_teams_manager_own" ON public.fantasy_teams;
CREATE POLICY "fantasy_teams_manager_own"
  ON public.fantasy_teams FOR INSERT TO authenticated
  WITH CHECK (
    public.is_fantasy_manager()
    AND manager_id = auth.uid()
  );

DROP POLICY IF EXISTS "fantasy_teams_manager_update_own" ON public.fantasy_teams;
CREATE POLICY "fantasy_teams_manager_update_own"
  ON public.fantasy_teams FOR UPDATE TO authenticated
  USING (manager_id = auth.uid() AND public.is_fantasy_manager())
  WITH CHECK (manager_id = auth.uid() AND public.is_fantasy_manager());

DROP POLICY IF EXISTS "fantasy_teams_admin_all" ON public.fantasy_teams;
CREATE POLICY "fantasy_teams_admin_all"
  ON public.fantasy_teams FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "fantasy_selections_select_authenticated" ON public.fantasy_selections;
CREATE POLICY "fantasy_selections_select_authenticated"
  ON public.fantasy_selections FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "fantasy_selections_manager_own" ON public.fantasy_selections;
CREATE POLICY "fantasy_selections_manager_own"
  ON public.fantasy_selections FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.fantasy_teams ft
      WHERE ft.id = fantasy_team_id
        AND ft.manager_id = auth.uid()
        AND public.is_fantasy_manager()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.fantasy_teams ft
      WHERE ft.id = fantasy_team_id
        AND ft.manager_id = auth.uid()
        AND public.is_fantasy_manager()
    )
  );

DROP POLICY IF EXISTS "fantasy_selections_admin_all" ON public.fantasy_selections;
CREATE POLICY "fantasy_selections_admin_all"
  ON public.fantasy_selections FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- invites & notifications
DROP POLICY IF EXISTS "invites_admin_all" ON public.invites;
CREATE POLICY "invites_admin_all"
  ON public.invites FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "gameweek_notifications_select_authenticated" ON public.gameweek_notifications;
CREATE POLICY "gameweek_notifications_select_authenticated"
  ON public.gameweek_notifications FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "gameweek_notifications_admin_all" ON public.gameweek_notifications;
CREATE POLICY "gameweek_notifications_admin_all"
  ON public.gameweek_notifications FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- API role grants (required when "Automatically expose new tables" is OFF)
-- ---------------------------------------------------------------------------

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON public.players TO anon;
GRANT SELECT ON public.gameweeks TO anon;
GRANT SELECT ON public.gameweek_players TO anon;

GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT INSERT, UPDATE, DELETE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO service_role;
