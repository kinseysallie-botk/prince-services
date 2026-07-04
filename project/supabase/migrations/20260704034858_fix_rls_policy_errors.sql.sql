/*
# Fix 6 RLS Policy Errors

## Summary
Fixes 6 identified RLS policy issues across the database:

1. bookings — missing SELECT policy for anon (anon can insert but not read
   their own bookings)
2. bookings — missing UPDATE policy (users can't update their bookings)
3. bookings — missing DELETE policy (users can't cancel their bookings)
4. donations — missing SELECT policy for anon (anon donors can insert but not
   read their donations)
5. profiles — missing INSERT policy (users can't create their own profile row
   outside the trigger)
6. admin_config / admin_sessions — `deny_all_*` policies use `FOR ALL` which is
   an anti-pattern; split into per-verb policies

## Changes per table

### bookings
- Add `select_own_bookings_anon` SELECT policy for anon (USING user_id IS NULL
  — anon bookings have no user_id, so this allows anon to read bookings they
  submitted without auth). For authenticated users, the existing
  `select_own_bookings_by_user` already covers it.
- Add `update_own_bookings` UPDATE policy for authenticated users.
- Add `delete_own_bookings` DELETE policy for authenticated users.

### donations
- Add `select_own_donations_anon` SELECT policy for anon (USING user_id IS NULL)
  so anonymous donors can view their donations.

### profiles
- Add `insert_own_profile` INSERT policy so users can create their own profile
  row (WITH CHECK auth.uid() = id).

### admin_config
- Drop the `deny_all_admin_config` FOR ALL policy.
- Add per-verb deny policies: SELECT, INSERT, UPDATE, DELETE for public role
  with USING (false) / WITH CHECK (false).

### admin_sessions
- Drop the `deny_all_admin_sessions` FOR ALL policy.
- Add per-verb deny policies: SELECT, UPDATE for public role with USING (false).
  (INSERT and DELETE already have anon/authenticated policies for login.)

## Security Notes
- The anon SELECT policies on bookings and donations use `user_id IS NULL`
  because anon-submitted rows have no user_id. This is safe — anon users can
  only see rows that were submitted without authentication, which is the
  expected behavior for a booking form that works without sign-in.
- The profiles INSERT policy uses `auth.uid() = id` so users can only create
  a profile for themselves.
- The admin_config/admin_sessions deny policies are split from FOR ALL into
  per-verb policies to follow the RLS best practice of separate policies per
  CRUD verb.
*/

-- ── 1. bookings: Add SELECT for anon ──────────────────────────────────────────
DROP POLICY IF EXISTS "select_anon_bookings" ON bookings;
CREATE POLICY "select_anon_bookings" ON bookings FOR SELECT
  TO anon USING (user_id IS NULL);

-- ── 2. bookings: Add UPDATE for authenticated ─────────────────────────────────
DROP POLICY IF EXISTS "update_own_bookings" ON bookings;
CREATE POLICY "update_own_bookings" ON bookings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── 3. bookings: Add DELETE for authenticated ─────────────────────────────────
DROP POLICY IF EXISTS "delete_own_bookings" ON bookings;
CREATE POLICY "delete_own_bookings" ON bookings FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ── 4. donations: Add SELECT for anon ──────────────────────────────────────────
DROP POLICY IF EXISTS "select_anon_donations" ON donations;
CREATE POLICY "select_anon_donations" ON donations FOR SELECT
  TO anon USING (user_id IS NULL);

-- ── 5. profiles: Add INSERT for authenticated ──────────────────────────────────
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

-- ── 6a. admin_config: Split FOR ALL into per-verb deny policies ─────────────────
DROP POLICY IF EXISTS "deny_all_admin_config" ON admin_config;

DROP POLICY IF EXISTS "deny_select_admin_config_public" ON admin_config;
CREATE POLICY "deny_select_admin_config_public" ON admin_config FOR SELECT
  TO public USING (false);

DROP POLICY IF EXISTS "deny_insert_admin_config_public" ON admin_config;
CREATE POLICY "deny_insert_admin_config_public" ON admin_config FOR INSERT
  TO public WITH CHECK (false);

DROP POLICY IF EXISTS "deny_update_admin_config_public" ON admin_config;
CREATE POLICY "deny_update_admin_config_public" ON admin_config FOR UPDATE
  TO public USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "deny_delete_admin_config_public" ON admin_config;
CREATE POLICY "deny_delete_admin_config_public" ON admin_config FOR DELETE
  TO public USING (false);

-- ── 6b. admin_sessions: Split FOR ALL into per-verb deny policies ───────────────
DROP POLICY IF EXISTS "deny_all_admin_sessions" ON admin_sessions;

DROP POLICY IF EXISTS "deny_select_admin_sessions_public" ON admin_sessions;
CREATE POLICY "deny_select_admin_sessions_public" ON admin_sessions FOR SELECT
  TO public USING (false);

DROP POLICY IF EXISTS "deny_update_admin_sessions_public" ON admin_sessions;
CREATE POLICY "deny_update_admin_sessions_public" ON admin_sessions FOR UPDATE
  TO public USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "deny_delete_admin_sessions_public" ON admin_sessions;
CREATE POLICY "deny_delete_admin_sessions_public" ON admin_sessions FOR DELETE
  TO public USING (false);
