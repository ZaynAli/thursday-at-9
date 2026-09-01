-- Phase 8: RLS hardening
-- Run in Supabase SQL Editor after the initial migration.
-- Safe to re-run (uses DROP POLICY IF EXISTS).

-- ---------------------------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.can_edit_fantasy_team(p_gameweek_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.gameweeks g
    WHERE g.id = p_gameweek_id
      AND g.status = 'selection_open'
      AND g.fantasy_deadline > now()
  );
$$;

CREATE OR REPLACE FUNCTION public.can_view_other_fantasy_teams(p_gameweek_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.gameweeks g
    WHERE g.id = p_gameweek_id
      AND g.status IN (
        'selection_locked',
        'in_progress',
        'results_pending',
        'published'
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.is_gameweek_published(p_gameweek_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.gameweeks g
    WHERE g.id = p_gameweek_id
      AND g.status = 'published'
  );
$$;

-- ---------------------------------------------------------------------------
-- Fantasy teams — own team always; others visible after lock
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "fantasy_teams_select_authenticated" ON public.fantasy_teams;
CREATE POLICY "fantasy_teams_select_scoped"
  ON public.fantasy_teams FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR manager_id = auth.uid()
    OR public.can_view_other_fantasy_teams(gameweek_id)
  );

DROP POLICY IF EXISTS "fantasy_teams_manager_own" ON public.fantasy_teams;
CREATE POLICY "fantasy_teams_manager_insert_own"
  ON public.fantasy_teams FOR INSERT TO authenticated
  WITH CHECK (
    public.is_fantasy_manager()
    AND manager_id = auth.uid()
    AND public.can_edit_fantasy_team(gameweek_id)
  );

DROP POLICY IF EXISTS "fantasy_teams_manager_update_own" ON public.fantasy_teams;
CREATE POLICY "fantasy_teams_manager_update_own"
  ON public.fantasy_teams FOR UPDATE TO authenticated
  USING (
    manager_id = auth.uid()
    AND public.is_fantasy_manager()
    AND public.can_edit_fantasy_team(gameweek_id)
  )
  WITH CHECK (
    manager_id = auth.uid()
    AND public.is_fantasy_manager()
    AND public.can_edit_fantasy_team(gameweek_id)
  );

-- ---------------------------------------------------------------------------
-- Fantasy selections — follow parent team visibility / edit rules
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "fantasy_selections_select_authenticated" ON public.fantasy_selections;
CREATE POLICY "fantasy_selections_select_scoped"
  ON public.fantasy_selections FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.fantasy_teams ft
      WHERE ft.id = fantasy_team_id
        AND (
          ft.manager_id = auth.uid()
          OR public.can_view_other_fantasy_teams(ft.gameweek_id)
        )
    )
  );

DROP POLICY IF EXISTS "fantasy_selections_manager_own" ON public.fantasy_selections;
CREATE POLICY "fantasy_selections_manager_write_own"
  ON public.fantasy_selections FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.fantasy_teams ft
      WHERE ft.id = fantasy_team_id
        AND ft.manager_id = auth.uid()
        AND public.is_fantasy_manager()
        AND public.can_edit_fantasy_team(ft.gameweek_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.fantasy_teams ft
      WHERE ft.id = fantasy_team_id
        AND ft.manager_id = auth.uid()
        AND public.is_fantasy_manager()
        AND public.can_edit_fantasy_team(ft.gameweek_id)
    )
  );

-- ---------------------------------------------------------------------------
-- Player gameweek stats — published only (admins use service role in app)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "player_gameweek_stats_select_authenticated" ON public.player_gameweek_stats;
CREATE POLICY "player_gameweek_stats_select_published"
  ON public.player_gameweek_stats FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR public.is_gameweek_published(gameweek_id)
  );

-- ---------------------------------------------------------------------------
-- Invites — managers can read their own player's pending invite (join flow)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "invites_select_by_token" ON public.invites;
CREATE POLICY "invites_select_pending"
  ON public.invites FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR status = 'pending'
  );
