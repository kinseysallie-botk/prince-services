/*
# Fix Critical RLS Security Issues

## Issues Found
1. admin_config: `anon_select_admin_config_for_login` policy allows anyone to SELECT 
   the admin password hash with `USING (true)`. This is a critical vulnerability!
   The admin_login function already uses SECURITY DEFINER to access admin_config,
   so this policy is both dangerous AND unnecessary.

2. Ensure all SECURITY DEFINER functions have locked search_path (already done)

## Fixes
1. Drop the dangerous `anon_select_admin_config_for_login` policy
2. Ensure admin_config has NO direct access policies (only via SECURITY DEFINER functions)
3. Revoke EXECUTE on trigger functions from anon/authenticated (they're triggers, not RPCs)
*/

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. FIX: Remove public SELECT on admin_config (contains password hash!)
-- ═══════════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "anon_select_admin_config_for_login" ON admin_config;

-- admin_config should ONLY be accessible via SECURITY DEFINER functions
-- No policies needed - the functions handle all access

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. FIX: Revoke EXECUTE on trigger functions from anon/authenticated
--    Trigger functions should only be called by the trigger, not via RPC
-- ═══════════════════════════════════════════════════════════════════════════════
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_notes_updated_at() FROM anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. Ensure register_device and verify_recovery_code are properly secured
--    These should only be callable by authenticated users
-- ═══════════════════════════════════════════════════════════════════════════════
REVOKE EXECUTE ON FUNCTION public.register_device(text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.verify_recovery_code(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.generate_recovery_code() FROM anon;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. Make handle_new_user SECURITY INVOKER (it doesn't need elevated privileges)
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $function$
BEGIN
  INSERT INTO profiles (id, full_name, phone, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    now(),
    now()
  );
  RETURN NEW;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
