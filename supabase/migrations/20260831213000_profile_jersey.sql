-- Manager jersey shown on the fantasy formation view.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS jersey_id TEXT NOT NULL DEFAULT 'manutd';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_jersey_id_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_jersey_id_check
  CHECK (jersey_id IN ('manutd', 'arsenal'));
