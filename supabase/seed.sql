-- ============================================================
-- SEED DATA — run in Supabase SQL editor
-- Safe to run multiple times (uses ON CONFLICT DO NOTHING)
-- ============================================================

-- ============================================================
-- TEST USERS
-- ============================================================
INSERT INTO auth.users (
  instance_id, id, aud, role,
  email, encrypted_password, email_confirmed_at,
  created_at, updated_at,
  raw_user_meta_data, raw_app_meta_data,
  is_super_admin, confirmation_token, recovery_token,
  email_change_token_new, email_change
) VALUES
  ('00000000-0000-0000-0000-000000000000',
   'aaaaaaaa-aaaa-aaaa-aaaa-000000000001', 'authenticated', 'authenticated',
   'james@golftest.dev', '$2a$10$abcdefghijklmnopqrstuuVGmJMoxP2GOyt0dyVf7E6MVQK9eNHfq',
   NOW(), NOW(), NOW(), '{"full_name":"James McKenna"}', '{}',
   false, '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000',
   'aaaaaaaa-aaaa-aaaa-aaaa-000000000002', 'authenticated', 'authenticated',
   'sarah@golftest.dev', '$2a$10$abcdefghijklmnopqrstuuVGmJMoxP2GOyt0dyVf7E6MVQK9eNHfq',
   NOW(), NOW(), NOW(), '{"full_name":"Sarah Callahan"}', '{}',
   false, '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000',
   'aaaaaaaa-aaaa-aaaa-aaaa-000000000003', 'authenticated', 'authenticated',
   'ryan@golftest.dev', '$2a$10$abcdefghijklmnopqrstuuVGmJMoxP2GOyt0dyVf7E6MVQK9eNHfq',
   NOW(), NOW(), NOW(), '{"full_name":"Ryan Park"}', '{}',
   false, '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000',
   'aaaaaaaa-aaaa-aaaa-aaaa-000000000004', 'authenticated', 'authenticated',
   'lauren@golftest.dev', '$2a$10$abcdefghijklmnopqrstuuVGmJMoxP2GOyt0dyVf7E6MVQK9eNHfq',
   NOW(), NOW(), NOW(), '{"full_name":"Lauren Chu"}', '{}',
   false, '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000',
   'aaaaaaaa-aaaa-aaaa-aaaa-000000000005', 'authenticated', 'authenticated',
   'connor@golftest.dev', '$2a$10$abcdefghijklmnopqrstuuVGmJMoxP2GOyt0dyVf7E6MVQK9eNHfq',
   NOW(), NOW(), NOW(), '{"full_name":"Connor Walsh"}', '{}',
   false, '', '', '', '')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- PROFILES
-- ============================================================
INSERT INTO profiles (id, full_name, handicap, home_course, rounds_played, best_round, following_count, followers_count)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000001', 'James McKenna',  8.4, 'Windermere Golf & Country Club', 34, 72, 3, 5),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000002', 'Sarah Callahan', 14.1,'The Derrick Golf & Winter Club',  22, 80, 4, 3),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000003', 'Ryan Park',       3.2, 'Royal Mayfair Golf Club',         61, 68, 2, 8),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000004', 'Lauren Chu',     18.7,'Lewis Estates Golf Course',       15, 88, 2, 2),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000005', 'Connor Walsh',    1.1, 'Royal Mayfair Golf Club',         89, 66, 5, 12)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- COURSES (Edmonton area)
-- ============================================================
INSERT INTO courses (id, places_id, name, location, holes, type, star_rating, condition, lat, lng)
VALUES
  ('cccccccc-cccc-cccc-cccc-000000000001', 'gp_windermere',    'Windermere Golf & Country Club', 'Edmonton, AB',       18, 'semi-private', 4.6, 'Excellent', 53.4192, -113.5989),
  ('cccccccc-cccc-cccc-cccc-000000000002', 'gp_royal_mayfair', 'Royal Mayfair Golf Club',         'Edmonton, AB',       18, 'private',       4.8, 'Excellent', 53.5650, -113.5020),
  ('cccccccc-cccc-cccc-cccc-000000000003', 'gp_derrick',       'The Derrick Golf & Winter Club',  'Edmonton, AB',       18, 'private',       4.5, 'Good',      53.4801, -113.5232),
  ('cccccccc-cccc-cccc-cccc-000000000004', 'gp_lewis_estates', 'Lewis Estates Golf Course',       'Edmonton, AB',       18, 'public',        4.1, 'Good',      53.5241, -113.6823),
  ('cccccccc-cccc-cccc-cccc-000000000005', 'gp_raven_crest',   'Raven Crest Golf & Country Club', 'Nisku, AB',          18, 'semi-private', 4.3, 'Fair',      53.3612, -113.4981),
  ('cccccccc-cccc-cccc-cccc-000000000006', 'gp_coloniale',     'Coloniale Golf Club',             'Beaumont, AB',       18, 'public',        4.4, 'Good',      53.3521, -113.4102),
  ('cccccccc-cccc-cccc-cccc-000000000007', 'gp_riverside',     'Riverside Golf Course',           'Edmonton, AB',       18, 'public',        3.9, 'Fair',      53.5321, -113.4389),
  ('cccccccc-cccc-cccc-cccc-000000000008', 'gp_to_the_greens', 'To The Greens Golf Course',       'Edmonton, AB',       18, 'public',        4.0, 'Good',      53.5089, -113.6123)
ON CONFLICT (places_id) DO NOTHING;


-- ============================================================
-- ROUNDS
-- ============================================================
INSERT INTO rounds (id, user_id, course_id, game_mode, gross_score, vs_par, gir_count, likes_count, comments_count, created_at)
VALUES
  -- James
  ('b0b0b0b0-b0b0-b0b0-b0b0-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-000000000001', 'cccccccc-cccc-cccc-cccc-000000000001', 'stroke', 78,  6, 11, 12, 3, NOW() - INTERVAL '2 days'),
  ('b0b0b0b0-b0b0-b0b0-b0b0-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-000000000001', 'cccccccc-cccc-cccc-cccc-000000000003', 'stroke', 75,  3,  9,  8, 1, NOW() - INTERVAL '9 days'),
  ('b0b0b0b0-b0b0-b0b0-b0b0-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-000000000001', 'cccccccc-cccc-cccc-cccc-000000000002', 'stroke', 72,  0, 13, 24, 5, NOW() - INTERVAL '16 days'),
  -- Sarah
  ('b0b0b0b0-b0b0-b0b0-b0b0-000000000004', 'aaaaaaaa-aaaa-aaaa-aaaa-000000000002', 'cccccccc-cccc-cccc-cccc-000000000003', 'stroke', 88, 16,  6,  7, 2, NOW() - INTERVAL '5 days'),
  ('b0b0b0b0-b0b0-b0b0-b0b0-000000000005', 'aaaaaaaa-aaaa-aaaa-aaaa-000000000002', 'cccccccc-cccc-cccc-cccc-000000000004', 'stroke', 84, 12,  8,  4, 0, NOW() - INTERVAL '14 days'),
  -- Ryan
  ('b0b0b0b0-b0b0-b0b0-b0b0-000000000006', 'aaaaaaaa-aaaa-aaaa-aaaa-000000000003', 'cccccccc-cccc-cccc-cccc-000000000002', 'stroke', 70, -2, 15, 41, 9, NOW() - INTERVAL '1 day'),
  ('b0b0b0b0-b0b0-b0b0-b0b0-000000000007', 'aaaaaaaa-aaaa-aaaa-aaaa-000000000003', 'cccccccc-cccc-cccc-cccc-000000000001', 'stroke', 68, -4, 16, 67, 14,NOW() - INTERVAL '8 days'),
  ('b0b0b0b0-b0b0-b0b0-b0b0-000000000008', 'aaaaaaaa-aaaa-aaaa-aaaa-000000000003', 'cccccccc-cccc-cccc-cccc-000000000006', 'match',  71, -1, 14, 22, 3, NOW() - INTERVAL '20 days'),
  -- Lauren
  ('b0b0b0b0-b0b0-b0b0-b0b0-000000000009', 'aaaaaaaa-aaaa-aaaa-aaaa-000000000004', 'cccccccc-cccc-cccc-cccc-000000000004', 'stroke', 92, 20,  4,  5, 1, NOW() - INTERVAL '4 days'),
  -- Connor
  ('b0b0b0b0-b0b0-b0b0-b0b0-000000000010', 'aaaaaaaa-aaaa-aaaa-aaaa-000000000005', 'cccccccc-cccc-cccc-cccc-000000000002', 'stroke', 66, -6, 16, 87, 18,NOW() - INTERVAL '3 days'),
  ('b0b0b0b0-b0b0-b0b0-b0b0-000000000011', 'aaaaaaaa-aaaa-aaaa-aaaa-000000000005', 'cccccccc-cccc-cccc-cccc-000000000003', 'skins',  69, -3, 14, 54, 7, NOW() - INTERVAL '10 days')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- FOLLOWS
-- (all follow Connor since he posts the best scores)
-- ============================================================
INSERT INTO follows (follower_id, following_id)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-000000000003'), -- James follows Ryan
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-000000000005'), -- James follows Connor
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-000000000001'), -- Sarah follows James
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-000000000005'), -- Sarah follows Connor
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-000000000005'), -- Ryan follows Connor
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000004', 'aaaaaaaa-aaaa-aaaa-aaaa-000000000001'), -- Lauren follows James
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000004', 'aaaaaaaa-aaaa-aaaa-aaaa-000000000002'), -- Lauren follows Sarah
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000005', 'aaaaaaaa-aaaa-aaaa-aaaa-000000000003')  -- Connor follows Ryan
ON CONFLICT (follower_id, following_id) DO NOTHING;


-- ============================================================
-- CONDITION REVIEWS
-- ============================================================
INSERT INTO condition_reviews (id, user_id, course_id, condition, text, created_at)
VALUES
  ('eeeeeeee-eeee-eeee-eeee-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-000000000003', 'cccccccc-cccc-cccc-cccc-000000000002', 'Excellent', 'Greens were pure. Best conditions I have played all year. Pace was around 11.', NOW() - INTERVAL '1 day'),
  ('eeeeeeee-eeee-eeee-eeee-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-000000000001', 'cccccccc-cccc-cccc-cccc-000000000001', 'Good',      'Fairways in great shape. Greens a touch slow but overall excellent.', NOW() - INTERVAL '2 days'),
  ('eeeeeeee-eeee-eeee-eeee-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-000000000002', 'cccccccc-cccc-cccc-cccc-000000000003', 'Good',      'Back nine greens rolling quicker than the front. Course in solid shape for this time of year.', NOW() - INTERVAL '5 days'),
  ('eeeeeeee-eeee-eeee-eeee-000000000004', 'aaaaaaaa-aaaa-aaaa-aaaa-000000000004', 'cccccccc-cccc-cccc-cccc-000000000004', 'Fair',      'Fairways patchy in spots. Greens OK. Still a fun track.', NOW() - INTERVAL '4 days'),
  ('eeeeeeee-eeee-eeee-eeee-000000000005', 'aaaaaaaa-aaaa-aaaa-aaaa-000000000005', 'cccccccc-cccc-cccc-cccc-000000000006', 'Good',      'Underrated course. Conditions better than expected. Worth the drive.', NOW() - INTERVAL '10 days'),
  ('eeeeeeee-eeee-eeee-eeee-000000000006', 'aaaaaaaa-aaaa-aaaa-aaaa-000000000003', 'cccccccc-cccc-cccc-cccc-000000000005', 'Fair',      'Rough was thick, fairways soft. Greens spikey but holdable.', NOW() - INTERVAL '7 days')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- CLUBS (for James)
-- ============================================================
INSERT INTO clubs (user_id, name, carry_yardage)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000001', 'Driver',  268),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000001', '3 wood',  238),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000001', '5 wood',  218),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000001', '4 iron',  198),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000001', '5 iron',  186),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000001', '6 iron',  173),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000001', '7 iron',  161),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000001', '8 iron',  148),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000001', '9 iron',  135),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000001', 'PW',      122),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000001', 'GW',      106),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000001', 'SW',       88),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000001', 'LW',       71),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000001', 'Putter',    0)
ON CONFLICT (user_id, name) DO NOTHING;

-- Clubs for Connor (scratch golfer, longer)
INSERT INTO clubs (user_id, name, carry_yardage)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000005', 'Driver',  301),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000005', '3 wood',  268),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000005', '4 iron',  215),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000005', '5 iron',  202),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000005', '6 iron',  188),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000005', '7 iron',  175),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000005', '8 iron',  161),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000005', '9 iron',  147),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000005', 'PW',      133),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000005', 'SW',      102),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000005', 'LW',       80),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000005', 'Putter',    0)
ON CONFLICT (user_id, name) DO NOTHING;


-- ============================================================
-- SAVED COURSES (for James)
-- ============================================================
INSERT INTO saved_courses (user_id, course_id, places_id, course_name, course_location)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000001', 'cccccccc-cccc-cccc-cccc-000000000001', 'gp_windermere',    'Windermere Golf & Country Club', 'Edmonton, AB'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-000000000001', 'cccccccc-cccc-cccc-cccc-000000000003', 'gp_derrick',       'The Derrick Golf & Winter Club',  'Edmonton, AB')
ON CONFLICT (user_id, course_id) DO NOTHING;


-- ============================================================
-- TOURS
-- ============================================================
INSERT INTO tours (id, name, description, created_by, member_count)
VALUES
  ('d0d0d0d0-d0d0-d0d0-d0d0-000000000001', 'Edmonton Scratch League',  'Competitive stroke play for low handicappers in the Edmonton area.', 'aaaaaaaa-aaaa-aaaa-aaaa-000000000005', 4),
  ('d0d0d0d0-d0d0-d0d0-d0d0-000000000002', 'Friday Morning Skins',     'Weekly skins game — all handicaps welcome. Tee off 7am.', 'aaaaaaaa-aaaa-aaaa-aaaa-000000000001', 3),
  ('d0d0d0d0-d0d0-d0d0-d0d0-000000000003', 'YEG Golf Society',         'A relaxed group of Edmonton golfers. Fun rounds, no pressure.',      'aaaaaaaa-aaaa-aaaa-aaaa-000000000002', 5)
ON CONFLICT (id) DO NOTHING;

INSERT INTO tour_members (tour_id, user_id)
VALUES
  ('d0d0d0d0-d0d0-d0d0-d0d0-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-000000000005'),
  ('d0d0d0d0-d0d0-d0d0-d0d0-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-000000000003'),
  ('d0d0d0d0-d0d0-d0d0-d0d0-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-000000000001'),
  ('d0d0d0d0-d0d0-d0d0-d0d0-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-000000000002'),
  ('d0d0d0d0-d0d0-d0d0-d0d0-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-000000000001'),
  ('d0d0d0d0-d0d0-d0d0-d0d0-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-000000000003'),
  ('d0d0d0d0-d0d0-d0d0-d0d0-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-000000000004'),
  ('d0d0d0d0-d0d0-d0d0-d0d0-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-000000000002'),
  ('d0d0d0d0-d0d0-d0d0-d0d0-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-000000000001'),
  ('d0d0d0d0-d0d0-d0d0-d0d0-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-000000000004'),
  ('d0d0d0d0-d0d0-d0d0-d0d0-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-000000000003'),
  ('d0d0d0d0-d0d0-d0d0-d0d0-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-000000000005')
ON CONFLICT (tour_id, user_id) DO NOTHING;


-- ============================================================
-- UPDATE following/followers counts to match inserted follows
-- ============================================================
UPDATE profiles SET following_count = 2, followers_count = 1 WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-000000000001';
UPDATE profiles SET following_count = 2, followers_count = 2 WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-000000000002';
UPDATE profiles SET following_count = 1, followers_count = 3 WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-000000000003';
UPDATE profiles SET following_count = 2, followers_count = 0 WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-000000000004';
UPDATE profiles SET following_count = 1, followers_count = 4 WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-000000000005';
