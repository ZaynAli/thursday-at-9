-- Expand favorite-kit options to match src/lib/jerseys.ts

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_jersey_id_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_jersey_id_check
  CHECK (jersey_id IN (
    'acmilan',
    'arsenal',
    'athleticomadrid',
    'barca',
    'chelsea',
    'intermilan',
    'juventus',
    'liverpool',
    'mancity',
    'manutd',
    'realmadrid',
    'tottenham'
  ));
