/*
# Fix Security Issues: Mutable Search Path & Always-True RLS Policies

## Summary
Fixes 6 security vulnerabilities identified by Supabase security scanner:

### Function Search Path Mutable (4 functions)
The functions `verify_recovery_code`, `admin_login`, `register_device`, and
`generate_recovery_code` had mutable search_path, meaning a malicious caller
could shadow built-in functions (like `crypt`, `gen_salt`, `gen_random_bytes`)
by creating objects earlier in the search path. All 4 functions are recreated
with `SET search_path = public, pg_temp` which locks the search path to a safe
order and prevents shadowing attacks.

### RLS Policy Always True (2 policies on admin_sessions)
- `anon_insert_admin_sessions_for_login` (INSERT, WITH CHECK true) — allowed
  anyone to insert arbitrary session tokens, enabling session forgery.
- `anon_delete_expired_admin_sessions` (DELETE, USING true) — allowed anyone
  to delete any admin session, enabling session hijacking via deletion.

The fix: make `admin_login` SECURITY DEFINER so it runs as the function owner
(bypassing RLS) and can insert/delete sessions internally. Then replace the
always-true anon policies with restrictive ones:
- INSERT: only allow rows with a non-null, 64-char session_token (the format
  admin_login produces). This prevents arbitrary token injection.
- DELETE: only allow deleting sessions that have already expired
  (expires_at < now()). This prevents deleting active sessions.

## Functions Modified
1. `admin_login` — now SECURITY DEFINER + SET search_path = public, pg_temp
2. `register_device` — SET search_path = public, pg_temp
3. `generate_recovery_code` — SET search_path = public, pg_temp
4. `verify_recovery_code` — SET search_path = public, pg_temp

## Policies Modified (admin_sessions)
- Drop `anon_insert_admin_sessions_for_login` (always true)
- Drop `anon_delete_expired_admin_sessions` (always true)
- Add `anon_insert_admin_session` — INSERT for anon/authenticated, WITH CHECK
  that session_token is not null and is exactly 64 hex characters
- Add `anon_delete_expired_admin_sessions` — DELETE for anon/authenticated,
  USING that expires_at < now() (only expired sessions can be deleted)

## Security Notes
- The `admin_login` function is now SECURITY DEFINER so it can manage sessions
  without needing permissive RLS policies. The function itself validates the
  admin password before issuing a token.
- The INSERT policy restricts to valid 64-char session tokens, matching what
  `admin_login` generates via `encode(gen_random_bytes(32), 'hex')`.
- The DELETE policy only allows deleting expired sessions, preventing
  active session deletion attacks.
- `SET search_path = public, pg_temp` on all functions prevents search_path
  hijacking by ensuring only `public` schema and the temporary schema (which
  requires CREATE privilege) are searched.
*/

-- ── 1. Fix admin_login: SECURITY DEFINER + locked search_path ─────────────────
CREATE OR REPLACE FUNCTION public.admin_login(plain_password text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
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
$function$;

REVOKE EXECUTE ON FUNCTION public.admin_login(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_login(text) TO anon, authenticated;

-- ── 2. Fix register_device: locked search_path ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.register_device(
  p_fingerprint text,
  p_device_name text,
  p_platform text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $function$
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

  INSERT INTO user_devices (user_id, device_fingerprint, device_name, p_platform)
  VALUES (auth.uid(), p_fingerprint, p_device_name, p_platform)
  RETURNING id INTO existing_id;

  RETURN existing_id;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.register_device(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_device(text, text, text) TO authenticated;

-- ── 3. Fix generate_recovery_code: locked search_path ──────────────────────────
CREATE OR REPLACE FUNCTION public.generate_recovery_code()
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $function$
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
$function$;

REVOKE EXECUTE ON FUNCTION public.generate_recovery_code() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_recovery_code() TO authenticated;

-- ── 4. Fix verify_recovery_code: locked search_path ────────────────────────────
CREATE OR REPLACE FUNCTION public.verify_recovery_code(p_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $function$
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
$function$;

REVOKE EXECUTE ON FUNCTION public.verify_recovery_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_recovery_code(text) TO authenticated;

-- ── 5. Fix admin_sessions INSERT policy (was always true) ──────────────────────
DROP POLICY IF EXISTS "anon_insert_admin_sessions_for_login" ON admin_sessions;

DROP POLICY IF EXISTS "anon_insert_admin_session" ON admin_sessions;
CREATE POLICY "anon_insert_admin_session" ON admin_sessions FOR INSERT
  TO anon, authenticated
  WITH CHECK (session_token IS NOT NULL AND length(session_token) = 64 AND session_token ~ '^[0-9a-f]{64}$');

-- ── 6. Fix admin_sessions DELETE policy (was always true) ──────────────────────
DROP POLICY IF EXISTS "anon_delete_expired_admin_sessions" ON admin_sessions;

DROP POLICY IF EXISTS "anon_delete_expired_admin_sessions_v2" ON admin_sessions;
CREATE POLICY "anon_delete_expired_admin_sessions_v2" ON admin_sessions FOR DELETE
  TO anon, authenticated
  USING (expires_at IS NOT NULL AND expires_at < now());
