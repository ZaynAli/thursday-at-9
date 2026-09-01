-- Thursday@9 — roster seed (1.3)
-- Run in Supabase Dashboard → SQL Editor after initial migration.
-- Players only — no profiles, managers, gameweeks, or invites.
--
-- Re-runnable: upserts by fixed player id.

INSERT INTO public.players (id, name, skill_level, is_active, profile_id)
VALUES
  -- skill levels: carry over from prototype where names match; new players default to 3
  ('a1000001-0000-4000-8000-000000000001', 'Ramis',    4, true, NULL),
  ('a1000001-0000-4000-8000-000000000002', 'Osama',    4, true, NULL),
  ('a1000001-0000-4000-8000-000000000003', 'Zain',     3, true, NULL),
  ('a1000001-0000-4000-8000-000000000004', 'Nikhil',   2, true, NULL),
  ('a1000001-0000-4000-8000-000000000005', 'Owais',    3, true, NULL),
  ('a1000001-0000-4000-8000-000000000006', 'Zahin',    2, true, NULL),
  ('a1000001-0000-4000-8000-000000000007', 'Ibrahim',  2, true, NULL),
  ('a1000001-0000-4000-8000-000000000008', 'Jimmy',    5, true, NULL),
  ('a1000001-0000-4000-8000-000000000009', 'Shaafay',  3, true, NULL),
  ('a1000001-0000-4000-8000-000000000010', 'Shahrukh', 3, true, NULL),
  ('a1000001-0000-4000-8000-000000000011', 'Ibtehaj',  3, true, NULL),
  ('a1000001-0000-4000-8000-000000000012', 'Taha',     3, true, NULL),
  ('a1000001-0000-4000-8000-000000000013', 'Abdul',    2, true, NULL),
  ('a1000001-0000-4000-8000-000000000014', 'Moiz',     2, true, NULL),
  ('a1000001-0000-4000-8000-000000000015', 'Gagan',    3, true, NULL),
  ('a1000001-0000-4000-8000-000000000016', 'Hasan',    3, true, NULL),
  ('a1000001-0000-4000-8000-000000000017', 'Mukarram', 3, true, NULL),
  ('a1000001-0000-4000-8000-000000000018', 'Zohair',   3, true, NULL),
  ('a1000001-0000-4000-8000-000000000019', 'Sharjeel', 4, true, NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  skill_level = EXCLUDED.skill_level,
  is_active = EXCLUDED.is_active,
  profile_id = NULL,
  updated_at = now();

-- Verify
SELECT name, skill_level, is_active, profile_id IS NOT NULL AS has_profile
FROM public.players
ORDER BY name;
