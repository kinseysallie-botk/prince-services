/*
# Admin Authentication System for Prince Services

## Summary
Adds a secure, password-based admin authentication system that works without
Supabase Auth. Uses bcrypt password hashing (pgcrypto) and server-side session
tokens so the anon-key frontend can authenticate and perform admin operations
without exposing sensitive data.

## New Tables

### admin_config
Stores the admin password hash. Single row — never expose directly.
- password_hash (text): bcrypt hash of the admin password

### admin_sessions
Server-side session tokens issued after successful login.
- session_token (text): 64-character hex token stored by the browser
- expires_at (timestamptz): 8-hour expiry, auto-cleaned on login

## New Functions (all SECURITY DEFINER — bypass RLS)

1. admin_login(plain_password): Returns session_token string on success, null on failure
2. admin_verify_session(token): Returns boolean — is this token valid + unexpired?
3. admin_logout(token): Deletes the session token
4. admin_get_bookings(token): Returns JSON array of all bookings (admin only)
5. admin_update_booking(token, id, status, notes): Updates booking — admin only
6. admin_delete_booking(token, id): Deletes booking — admin only
7. admin_change_password(token, new_password): Change admin password — admin only

## Default Admin Password
Password: `PrinceAdmin2025`
(can be changed from the admin panel after first login)

## Security Notes
- RLS is enabled on both tables with NO public read/write policies
- All admin operations go through SECURITY DEFINER functions
- Session tokens expire after 8 hours
- Expired sessions are cleaned up on every login
- bcrypt work factor 8 — suitable for password verification
*/

-- Enable pgcrypto for bcrypt
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── admin_config ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;
-- No policies — accessed only via SECURITY DEFINER functions

-- Seed default admin password: PrinceAdmin2025
INSERT INTO admin_config (password_hash)
SELECT crypt('PrinceAdmin2025', gen_salt('bf', 8))
WHERE NOT EXISTS (SELECT 1 FROM admin_config);

-- ── admin_sessions ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '8 hours')
);

ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
-- No policies — accessed only via SECURITY DEFINER functions

-- ── admin_login ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_login(plain_password text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stored_hash text;
  new_token text;
BEGIN
  SELECT password_hash INTO stored_hash FROM admin_config LIMIT 1;
  IF stored_hash IS NULL THEN RETURN null; END IF;
  IF crypt(plain_password, stored_hash) != stored_hash THEN RETURN null; END IF;

  -- Clean expired sessions
  DELETE FROM admin_sessions WHERE expires_at < now();

  -- Issue new session token (64 hex chars = 32 random bytes)
  new_token := encode(gen_random_bytes(32), 'hex');
  INSERT INTO admin_sessions (session_token) VALUES (new_token);
  RETURN new_token;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_login(text) TO anon, authenticated;

-- ── admin_verify_session ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_verify_session(token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_sessions
    WHERE session_token = token AND expires_at > now()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION admin_verify_session(text) TO anon, authenticated;

-- ── admin_logout ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_logout(token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM admin_sessions WHERE session_token = token;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_logout(text) TO anon, authenticated;

-- ── admin_get_bookings ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_get_bookings(token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT admin_verify_session(token) THEN
    RAISE EXCEPTION 'Unauthorized: invalid or expired session';
  END IF;
  RETURN (
    SELECT COALESCE(json_agg(b ORDER BY b.created_at DESC), '[]'::json)
    FROM bookings b
  );
END;
$$;

GRANT EXECUTE ON FUNCTION admin_get_bookings(text) TO anon, authenticated;

-- ── admin_update_booking ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_update_booking(
  token text,
  booking_id uuid,
  new_status text,
  new_notes text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT admin_verify_session(token) THEN RETURN false; END IF;
  UPDATE bookings
  SET status = new_status, admin_notes = new_notes, updated_at = now()
  WHERE id = booking_id;
  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_update_booking(text, uuid, text, text) TO anon, authenticated;

-- ── admin_delete_booking ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_delete_booking(token text, booking_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT admin_verify_session(token) THEN RETURN false; END IF;
  DELETE FROM bookings WHERE id = booking_id;
  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_delete_booking(text, uuid) TO anon, authenticated;

-- ── admin_change_password ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_change_password(token text, new_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT admin_verify_session(token) THEN RETURN false; END IF;
  UPDATE admin_config SET password_hash = crypt(new_password, gen_salt('bf', 8));
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_change_password(text, text) TO anon, authenticated;
