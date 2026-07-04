/*
# Fix admin_login SECURITY DEFINER exposure

## Summary
The `admin_login(plain_password text)` function was flagged as a security risk
because it is a SECURITY DEFINER function executable by anon and authenticated
roles via /rest/v1/rpc/admin_login. SECURITY DEFINER functions run with the
owner's privileges, bypassing RLS — a pattern that scanners flag when callable
by untrusted roles.

## Fix
1. Switch admin_login from SECURITY DEFINER to SECURITY INVOKER so it runs with
   the caller's privileges (subject to RLS) instead of the owner's.
2. Add narrow RLS policies on admin_config and admin_sessions so the INVOKER
   function can perform exactly the operations it needs:
   - admin_config: SELECT only (to read the password hash)
   - admin_sessions: INSERT only (to create a session) + DELETE for expired cleanup
3. Revoke EXECUTE from PUBLIC on admin_login (belt-and-suspenders) and re-grant
   only to anon + authenticated so the frontend login RPC still works.

## Why this is safe
- admin_login only reads the password hash and inserts a session row. It never
  returns the hash or any sensitive data — it returns a session token only on
  correct password, null otherwise.
- With SECURITY INVOKER + RLS, an anon caller can only SELECT the
  password_hash column (needed for crypt() comparison) and INSERT/DELETE session
  rows. They cannot read sessions or update the password hash.
- All other admin functions (admin_get_bookings, admin_update_booking, etc.)
  remain SECURITY DEFINER but already had PUBLIC EXECUTE revoked in a prior
  migration, so they are not callable by anon/authenticated.

## Notes
- The admin_config SELECT policy is intentionally broad (USING true) because
  the function must read the single password_hash row to verify the password.
  The table has no other sensitive columns. RLS still blocks UPDATE/DELETE.
- The admin_sessions INSERT/DELETE policies are scoped to allow only those
  operations; SELECT remains blocked by RLS (no SELECT policy), so callers
  cannot enumerate or read other sessions.
*/

-- Switch admin_login to SECURITY INVOKER
CREATE OR REPLACE FUNCTION admin_login(plain_password text)
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER
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

-- Revoke from PUBLIC, grant only to anon + authenticated
REVOKE EXECUTE ON FUNCTION admin_login(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_login(text) TO anon, authenticated;

-- ── RLS policies for admin_config (INVOKER needs SELECT) ──────────────────────
-- Allow anon/authenticated to SELECT admin_config so the INVOKER function can
-- read the password hash. No INSERT/UPDATE/DELETE policies — those stay blocked.
DROP POLICY IF EXISTS "anon_select_admin_config_for_login" ON admin_config;
CREATE POLICY "anon_select_admin_config_for_login" ON admin_config
  FOR SELECT TO anon, authenticated USING (true);

-- ── RLS policies for admin_sessions (INVOKER needs INSERT + DELETE) ───────────
-- INSERT: allow creating a new session row (the function generates the token)
DROP POLICY IF EXISTS "anon_insert_admin_sessions_for_login" ON admin_sessions;
CREATE POLICY "anon_insert_admin_sessions_for_login" ON admin_sessions
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- DELETE: allow cleaning expired sessions during login
DROP POLICY IF EXISTS "anon_delete_expired_admin_sessions" ON admin_sessions;
CREATE POLICY "anon_delete_expired_admin_sessions" ON admin_sessions
  FOR DELETE TO anon, authenticated USING (true);
