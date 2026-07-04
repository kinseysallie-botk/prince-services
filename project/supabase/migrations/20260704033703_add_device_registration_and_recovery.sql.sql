/*
# Device Registration & Recovery System

## Summary
Creates a `user_devices` table to track every device a user logs in from,
plus a recovery code system so users can recover their account if they lose
access to a device. Each device registration stores a fingerprint (browser
identifier), device name, last-seen timestamp, and an optional trust flag.
A recovery code is generated on first device registration and can be used
to verify identity when adding a new device or recovering access.

## New Tables

### user_devices
Tracks every device/browser a user has logged in from.
- id (uuid, primary key)
- user_id (uuid, FK to auth.users, NOT NULL, DEFAULT auth.uid())
- device_fingerprint (text, NOT NULL) — a hash identifying the browser/device
- device_name (text) — human-readable label (e.g. "Chrome on Windows")
- platform (text) — OS/platform info
- last_seen_at (timestamptz) — updated on each login
- is_trusted (boolean, default true) — trusted devices can skip recovery
- created_at (timestamptz)

### recovery_codes
Stores recovery codes for users to regain access.
- id (uuid, primary key)
- user_id (uuid, FK to auth.users, NOT NULL, DEFAULT auth.uid())
- code_hash (text, NOT NULL) — bcrypt hash of the recovery code
- used (boolean, default false)
- created_at (timestamptz)
- used_at (timestamptz) — when the code was consumed

## Security
- RLS enabled on both tables with owner-scoped policies (auth.uid() = user_id).
- user_id columns default to auth.uid() so inserts from the client work.
- Recovery codes are stored as bcrypt hashes, never plaintext.
- Only the user can see, create, update, or delete their own devices and codes.

## Important Notes
1. The frontend generates a device fingerprint from browser properties
   (userAgent, screen resolution, timezone, language) and sends it on login.
2. If a device is not recognized, the user can enter a recovery code to
   verify their identity and register the new device.
3. Recovery codes are 8-character alphanumeric strings, shown once on
   first device registration.
4. The user can view and manage their devices from the User Dashboard.
*/

-- ── user_devices ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  device_fingerprint text NOT NULL,
  device_name text,
  platform text,
  last_seen_at timestamptz DEFAULT now(),
  is_trusted boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;

-- Unique constraint: one device record per user per fingerprint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_devices_user_fingerprint_uniq') THEN
    ALTER TABLE user_devices ADD CONSTRAINT user_devices_user_fingerprint_uniq UNIQUE (user_id, device_fingerprint);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id);

DROP POLICY IF EXISTS "select_own_devices" ON user_devices;
CREATE POLICY "select_own_devices" ON user_devices FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_devices" ON user_devices;
CREATE POLICY "insert_own_devices" ON user_devices FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_devices" ON user_devices;
CREATE POLICY "update_own_devices" ON user_devices FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_devices" ON user_devices;
CREATE POLICY "delete_own_devices" ON user_devices FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ── recovery_codes ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recovery_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash text NOT NULL,
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  used_at timestamptz
);

ALTER TABLE recovery_codes ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_recovery_codes_user_id ON recovery_codes(user_id);

DROP POLICY IF EXISTS "select_own_recovery_codes" ON recovery_codes;
CREATE POLICY "select_own_recovery_codes" ON recovery_codes FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_recovery_codes" ON recovery_codes;
CREATE POLICY "insert_own_recovery_codes" ON recovery_codes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_recovery_codes" ON recovery_codes;
CREATE POLICY "update_own_recovery_codes" ON recovery_codes FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_recovery_codes" ON recovery_codes;
CREATE POLICY "delete_own_recovery_codes" ON recovery_codes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ── Functions for device management ───────────────────────────────────────────

-- Register or update a device (upsert by fingerprint)
CREATE OR REPLACE FUNCTION register_device(
  p_fingerprint text,
  p_device_name text,
  p_platform text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  existing_id uuid;
BEGIN
  SELECT id INTO existing_id
  FROM user_devices
  WHERE user_id = auth.uid() AND device_fingerprint = p_fingerprint
  LIMIT 1;

  IF existing_id IS NOT NULL THEN
    UPDATE user_devices
    SET last_seen_at = now(), device_name = p_device_name, platform = p_platform
    WHERE id = existing_id;
    RETURN existing_id;
  END IF;

  INSERT INTO user_devices (user_id, device_fingerprint, device_name, platform)
  VALUES (auth.uid(), p_fingerprint, p_device_name, p_platform)
  RETURNING id INTO existing_id;

  RETURN existing_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION register_device(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION register_device(text, text, text) TO authenticated;

-- Generate a recovery code for the current user (returns plaintext once)
CREATE OR REPLACE FUNCTION generate_recovery_code()
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  raw_code text;
  code_id uuid;
BEGIN
  raw_code := upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8));
  INSERT INTO recovery_codes (user_id, code_hash)
  VALUES (auth.uid(), crypt(raw_code, gen_salt('bf', 8)))
  RETURNING id INTO code_id;
  RETURN raw_code;
END;
$$;

REVOKE EXECUTE ON FUNCTION generate_recovery_code() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION generate_recovery_code() TO authenticated;

-- Verify a recovery code (marks it as used if valid)
CREATE OR REPLACE FUNCTION verify_recovery_code(p_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  code_record record;
BEGIN
  SELECT * INTO code_record
  FROM recovery_codes
  WHERE user_id = auth.uid() AND used = false
  ORDER BY created_at DESC
  LIMIT 1;

  IF code_record IS NULL THEN RETURN false; END IF;
  IF crypt(p_code, code_record.code_hash) != code_record.code_hash THEN RETURN false; END IF;

  UPDATE recovery_codes SET used = true, used_at = now() WHERE id = code_record.id;
  RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION verify_recovery_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION verify_recovery_code(text) TO authenticated;
