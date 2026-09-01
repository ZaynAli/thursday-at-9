-- Optional: seed current season (Phase 5)
-- Run once in Supabase SQL Editor if you prefer manual setup.
-- The app also auto-creates a season on first gameweek save.

INSERT INTO public.seasons (id, name, start_date, is_current)
VALUES (
  'b1000001-0000-4000-8000-000000000001',
  'Thursday@9 2026',
  '2026-01-01',
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  is_current = EXCLUDED.is_current;
