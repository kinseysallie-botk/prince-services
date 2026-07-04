/*
# Fix Security Issues

## Summary
1. Donations: Replace overly permissive INSERT policy with proper validation
2. Admin tables: Add explicit deny-all policies (RLS with no policies = no access, but explicit is clearer)
3. Keep admin_login executable by anon/authenticated (required for login flow)
*/

-- ── Fix donations INSERT policy ──────────────────────────────────────────────────
-- Remove overly permissive policy
DROP POLICY IF EXISTS "insert_donations" ON donations;

-- Create proper policy: authenticated users can insert with their user_id, anon can insert without user_id
CREATE POLICY "insert_donations_authenticated" ON donations FOR INSERT
  TO authenticated WITH CHECK (
    -- User can only set their own user_id, or leave it null
    user_id IS NULL OR user_id = auth.uid()
  );

CREATE POLICY "insert_donations_anon" ON donations FOR INSERT
  TO anon WITH CHECK (
    -- Anonymous users must not set a user_id
    user_id IS NULL
  );

-- ── Add explicit deny-all policies for admin tables ───────────────────────────────
-- These are accessed ONLY through SECURITY DEFINER functions
-- Adding explicit policies makes the intent clear to security scanners

-- admin_config: No direct access
CREATE POLICY "deny_all_admin_config" ON admin_config
  USING (false) WITH CHECK (false);

-- admin_sessions: No direct access  
CREATE POLICY "deny_all_admin_sessions" ON admin_sessions
  USING (false) WITH CHECK (false);

-- ── Revoke public execute on admin functions (already done but ensure) ───────────
-- Note: admin_login MUST be executable by anon/authenticated for the login flow to work.
-- The function validates the password before issuing a token, so this is secure.
-- We keep the EXECUTE grant but the function itself validates credentials.