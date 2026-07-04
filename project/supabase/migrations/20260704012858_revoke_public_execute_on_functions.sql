/*
# Revoke EXECUTE from PUBLIC on SECURITY DEFINER functions

## Summary
The previous migration revoked EXECUTE from `anon` and `authenticated` roles, but
PostgreSQL functions are executable by PUBLIC by default (the implicit PUBLIC role
includes all roles). The revokes from anon/authenticated had no effect because the
PUBLIC grant remained. This migration revokes EXECUTE from PUBLIC on all admin
SECURITY DEFINER functions and the handle_new_user trigger function, then re-grants
EXECUTE only where explicitly needed.

## Security Changes
- REVOKE EXECUTE FROM PUBLIC on: admin_verify_session, admin_logout,
  admin_get_bookings, admin_update_booking, admin_delete_booking,
  admin_change_password, handle_new_user.
- admin_login: REVOKE FROM PUBLIC, then GRANT to anon + authenticated so the
  frontend login RPC works.
- update_updated_at_column and update_notes_updated_at: these are trigger functions
  (SECURITY INVOKER by default, no SECURITY DEFINER) — revoke from PUBLIC for
  hygiene, though they are not callable via RPC in a harmful way.

## Notes
1. admin_login must remain callable by anon (the frontend login form uses the anon
   key). It verifies the password internally and returns a session token only on
   success.
2. All other admin functions require a valid session token argument and verify it
   internally via admin_verify_session. Revoking PUBLIC EXECUTE prevents anonymous
   RPC invocation; the service role bypasses these grants.
3. handle_new_user is a trigger — it fires on INSERT to auth.users, not via RPC.
   Revoking PUBLIC EXECUTE does not affect the trigger.
*/

REVOKE EXECUTE ON FUNCTION public.admin_login(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_login(text) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_verify_session(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_logout(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_get_bookings(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_update_booking(text, uuid, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_delete_booking(text, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_change_password(text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;

-- Trigger functions (not SECURITY DEFINER, but revoke for hygiene)
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_notes_updated_at() FROM PUBLIC;
