/*
# Tighten admin_select_bookings policy

## Summary
The original admin_select_bookings policy allowed any authenticated user to SELECT
all bookings (USING (true)). This is unnecessary — the select_own_bookings_by_user
policy already lets users see their own bookings, and admin operations go through
SECURITY DEFINER functions that bypass RLS. Drop the overly-permissive policy.

## Security Changes
- DROP POLICY admin_select_bookings on bookings table.
*/

DROP POLICY IF EXISTS "admin_select_bookings" ON bookings;
