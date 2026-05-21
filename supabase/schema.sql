-- ============================================================
-- Golf App — Supabase Schema
-- Run this in the Supabase SQL editor (Dashboard → SQL editor)
-- ============================================================


-- ------------------------------------------------------------
-- PROFILES
-- Extends the auth.users table. Created automatically on signup
-- via the trigger below.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name         TEXT,
  avatar_url        TEXT,
  handicap          NUMERIC(4, 1),
  home_course       TEXT,
  rounds_played     INTEGER NOT NULL DEFAULT 0,
  best_round        INTEGER,
  following_count   INTEGER NOT NULL DEFAULT 0,
  followers_count   INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ------------------------------------------------------------
-- COURSES
-- Canonical course records. Populated via Google Places upsert
-- when a user saves or plays a course for the first time.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS courses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  places_id   TEXT UNIQUE,         -- Google Places ID
  name        TEXT NOT NULL,
  location    TEXT,
  holes       INTEGER DEFAULT 18,
  type        TEXT CHECK (type IN ('public', 'semi-private', 'private')),
  star_rating NUMERIC(3, 1),
  condition   TEXT CHECK (condition IN ('Excellent', 'Good', 'Fair', 'Poor')),
  lat         NUMERIC(10, 7),
  lng         NUMERIC(10, 7),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ------------------------------------------------------------
-- SAVED COURSES
-- Courses a user has explicitly saved from Explore or Play.
-- Stores denormalised name/location for fast display without joins.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS saved_courses (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id        UUID REFERENCES courses(id) ON DELETE CASCADE,
  places_id        TEXT,           -- kept for lookup before course row exists
  course_name      TEXT NOT NULL,
  course_location  TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, course_id)
);


-- ------------------------------------------------------------
-- ROUNDS
-- A completed (or in-progress) round of golf.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rounds (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id      UUID REFERENCES courses(id),
  game_mode      TEXT CHECK (game_mode IN ('stroke', 'match', 'skins')),
  gross_score    INTEGER,
  vs_par         INTEGER,
  gir_count      INTEGER,
  likes_count    INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ------------------------------------------------------------
-- FOLLOWS
-- Social graph — who follows whom.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS follows (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (follower_id, following_id),
  CHECK (follower_id <> following_id)
);


-- ------------------------------------------------------------
-- CONDITION REVIEWS
-- Crowdsourced course condition reports, AllTrails-style.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS condition_reviews (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id  UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  condition  TEXT NOT NULL CHECK (condition IN ('Excellent', 'Good', 'Fair', 'Poor')),
  text       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ------------------------------------------------------------
-- CLUBS
-- A user's bag — one row per club.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clubs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  carry_yardage  INTEGER,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, name)
);


-- ------------------------------------------------------------
-- TOURS
-- Groups users can join for shared leaderboards and stats.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tours (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  description  TEXT,
  created_by   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  member_count INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tour_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id    UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tour_id, user_id)
);

-- Tours: anyone can read, authenticated users can create/join
ALTER TABLE tours        ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tours_select"        ON tours        FOR SELECT USING (true);
CREATE POLICY "tours_insert"        ON tours        FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "tours_update"        ON tours        FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "tour_members_select" ON tour_members FOR SELECT USING (true);
CREATE POLICY "tour_members_insert" ON tour_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tour_members_delete" ON tour_members FOR DELETE USING (auth.uid() = user_id);

-- Additional profile columns
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS bio                 TEXT,
  ADD COLUMN IF NOT EXISTS is_private          BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stat_slot_1         TEXT DEFAULT 'rounds',
  ADD COLUMN IF NOT EXISTS stat_slot_2         TEXT DEFAULT 'best_round',
  ADD COLUMN IF NOT EXISTS stat_slot_3         TEXT DEFAULT 'following',
  ADD COLUMN IF NOT EXISTS stat_slot_4         TEXT DEFAULT 'followers',
  ADD COLUMN IF NOT EXISTS theme               TEXT DEFAULT 'dark',
  ADD COLUMN IF NOT EXISTS push_notifications  BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_followers    BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_comments     BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS distance_unit       TEXT DEFAULT 'auto';


-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();


-- ============================================================
-- UPDATE following_count / followers_count ON FOLLOW / UNFOLLOW
-- ============================================================
CREATE OR REPLACE FUNCTION handle_follow_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles SET following_count  = following_count  + 1 WHERE id = NEW.follower_id;
    UPDATE profiles SET followers_count  = followers_count  + 1 WHERE id = NEW.following_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles SET following_count  = GREATEST(following_count  - 1, 0) WHERE id = OLD.follower_id;
    UPDATE profiles SET followers_count  = GREATEST(followers_count  - 1, 0) WHERE id = OLD.following_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_follow_change ON follows;
CREATE TRIGGER on_follow_change
  AFTER INSERT OR DELETE ON follows
  FOR EACH ROW
  EXECUTE FUNCTION handle_follow_change();


-- ============================================================
-- UPDATE rounds_played / best_round WHEN A ROUND IS POSTED
-- ============================================================
CREATE OR REPLACE FUNCTION handle_round_posted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET
    rounds_played = rounds_played + 1,
    best_round    = LEAST(COALESCE(best_round, NEW.gross_score), NEW.gross_score)
  WHERE id = NEW.user_id;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_round_posted ON rounds;
CREATE TRIGGER on_round_posted
  AFTER INSERT ON rounds
  FOR EACH ROW
  WHEN (NEW.gross_score IS NOT NULL)
  EXECUTE FUNCTION handle_round_posted();


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses           ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_courses     ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds            ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows           ENABLE ROW LEVEL SECURITY;
ALTER TABLE condition_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs             ENABLE ROW LEVEL SECURITY;


-- profiles — anyone can read, owner can update
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- courses — anyone can read, authenticated users can upsert
CREATE POLICY "courses_select" ON courses FOR SELECT USING (true);
CREATE POLICY "courses_insert" ON courses FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "courses_update" ON courses FOR UPDATE USING (auth.uid() IS NOT NULL);

-- saved_courses — owner only
CREATE POLICY "saved_courses_select" ON saved_courses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "saved_courses_insert" ON saved_courses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "saved_courses_delete" ON saved_courses FOR DELETE USING (auth.uid() = user_id);

-- rounds — anyone can read, owner can write
CREATE POLICY "rounds_select" ON rounds FOR SELECT USING (true);
CREATE POLICY "rounds_insert" ON rounds FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rounds_update" ON rounds FOR UPDATE USING (auth.uid() = user_id);

-- follows — anyone can read, owner can write
CREATE POLICY "follows_select" ON follows FOR SELECT USING (true);
CREATE POLICY "follows_insert" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "follows_delete" ON follows FOR DELETE USING (auth.uid() = follower_id);

-- condition_reviews — anyone can read, owner can write
CREATE POLICY "condition_reviews_select" ON condition_reviews FOR SELECT USING (true);
CREATE POLICY "condition_reviews_insert" ON condition_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- clubs — owner only
CREATE POLICY "clubs_select" ON clubs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "clubs_insert" ON clubs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "clubs_update" ON clubs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "clubs_delete" ON clubs FOR DELETE USING (auth.uid() = user_id);
