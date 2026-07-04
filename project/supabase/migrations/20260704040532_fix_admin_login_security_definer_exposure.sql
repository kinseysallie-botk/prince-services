/*
# Fix admin_login SECURITY DEFINER Exposure

## Issue
The `admin_login(plain_password text)` function is SECURITY DEFINER and executable
by the `anon` role, allowing unauthenticated users to invoke a privileged function
via /rest/v1/rpc/admin_login.

## Solution
1. Revoke EXECUTE from `anon` on admin_login - only authenticated users can call it
2. Keep `authenticated` role with EXECUTE - users must be signed in to attempt admin login
3. Function remains SECURITY DEFINER (required to access admin_config and manage sessions)

## Security Rationale
- Admin login should require user authentication first (defense in depth)
- Anonymous users should not be able to invoke privileged functions
- The function validates the password, limiting exposure, but reducing attack surface
  by requiring authentication first adds an important security layer.
*/

-- Revoke EXECUTE from anon on admin_login
REVOKE EXECUTE ON FUNCTION public.admin_login(text) FROM anon;

-- Keep EXECUTE on authenticated (they still need to verify admin password)
-- (Already granted to authenticated, but ensure it's set)
GRANT EXECUTE ON FUNCTION public.admin_login(text) TO authenticated;

-- Also revoke from anon on other admin functions for consistency
REVOKE EXECUTE ON FUNCTION public.admin_verify_session(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_logout(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_get_bookings(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_update_booking(text, uuid, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_delete_booking(text, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_change_password(text, text) FROM anon;

-- Keep authenticated with execute on all admin functions
GRANT EXECUTE ON FUNCTION public.admin_verify_session(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_logout(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_bookings(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_booking(text, uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_booking(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_change_password(text, text) TO authenticated;
