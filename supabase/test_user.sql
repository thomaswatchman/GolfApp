-- Creates a real test account you can log into
-- Email:    test@golf.dev
-- Password: Test1234!

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  new_user_id UUID := gen_random_uuid();
  existing_id UUID;
BEGIN
  -- Check if user already exists
  SELECT id INTO existing_id FROM auth.users WHERE email = 'test@golf.dev';

  IF existing_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role,
      email, encrypted_password, email_confirmed_at,
      created_at, updated_at,
      raw_user_meta_data, raw_app_meta_data,
      is_super_admin, confirmation_token, recovery_token,
      email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated', 'authenticated',
      'test@golf.dev',
      crypt('Test1234!', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"full_name":"Test Player"}', '{}',
      false, '', '', '', ''
    );
  ELSE
    new_user_id := existing_id;
  END IF;

  -- Profile
  INSERT INTO profiles (id, full_name, handicap, home_course, rounds_played, best_round, following_count, followers_count)
  VALUES (new_user_id, 'Test Player', 12.4, 'Royal Mayfair Golf Club', 18, 76, 0, 0)
  ON CONFLICT (id) DO NOTHING;

  -- Bag
  INSERT INTO clubs (user_id, name, carry_yardage)
  SELECT new_user_id, name, carry_yardage FROM (VALUES
    ('Driver', 255), ('3 wood', 228), ('5 wood', 208),
    ('5 iron', 180), ('6 iron', 167), ('7 iron', 155),
    ('8 iron', 143), ('9 iron', 130), ('PW', 117),
    ('SW', 88), ('LW', 70), ('Putter', 0)
  ) AS t(name, carry_yardage)
  ON CONFLICT (user_id, name) DO NOTHING;

  -- Follow all seed users so the feed has content
  INSERT INTO follows (follower_id, following_id)
  SELECT new_user_id, id FROM profiles
  WHERE id != new_user_id
  ON CONFLICT (follower_id, following_id) DO NOTHING;

END $$;
