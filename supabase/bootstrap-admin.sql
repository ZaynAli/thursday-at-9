-- Bootstrap Zain as admin after first magic-link sign-in.
-- 1. Sign in at /login with your email (creates auth.users + profiles row via trigger).
-- 2. Replace YOUR_EMAIL below, run in Supabase SQL Editor.

DO $$
DECLARE
  v_user_id UUID;
  v_player_id UUID;
BEGIN
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'YOUR_EMAIL@example.com'
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No auth user for that email — sign in once via magic link first.';
  END IF;

  SELECT id INTO v_player_id
  FROM public.players
  WHERE name ILIKE 'Zain'
  LIMIT 1;

  UPDATE public.profiles
  SET
    is_admin = true,
    is_fantasy_manager = true,
    display_name = COALESCE(display_name, 'Zain'),
    initials = COALESCE(initials, 'ZA'),
    player_id = v_player_id
  WHERE id = v_user_id;

  IF v_player_id IS NOT NULL THEN
    UPDATE public.players
    SET profile_id = v_user_id
    WHERE id = v_player_id;
  END IF;
END $$;
