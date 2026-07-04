/*
# Create bookings table for Prince Services

## Summary
Creates a central bookings table that records all service enquiries and bookings
submitted through the website contact/booking form.

## New Tables

### bookings
Stores each booking/enquiry submitted by a site visitor.

| Column       | Type        | Description                                                      |
|--------------|-------------|------------------------------------------------------------------|
| id           | uuid PK     | Auto-generated primary key                                       |
| name         | text        | Client's full name                                               |
| email        | text        | Client's email address (optional)                                |
| phone        | text        | Client's phone / WhatsApp number (required)                      |
| service      | text        | Service the client is enquiring about                            |
| message      | text        | Additional details from the client                               |
| status       | text        | Booking status: 'pending' | 'in_progress' | 'completed' | 'cancelled' |
| admin_notes  | text        | Internal notes added by the admin                               |
| created_at   | timestamptz | When the booking was submitted                                   |
| updated_at   | timestamptz | Last time the booking was modified                               |

## Security

- RLS enabled on `bookings`.
- **Public (anon)** can INSERT — anyone on the website can submit a booking.
- **Authenticated users (admin)** can SELECT, UPDATE, DELETE all bookings.
- No row-level ownership needed; the admin role manages all records.

## Notes

1. The `status` field uses a text check constraint to enforce valid values.
2. `updated_at` is auto-updated via a trigger on any row change.
3. Designed as single-admin: any Supabase authenticated session is treated as admin.
*/

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text NOT NULL,
  service text NOT NULL,
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Auto-update updated_at on row modification
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_bookings_updated_at ON bookings;
CREATE TRIGGER set_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Public: anyone can submit a booking
DROP POLICY IF EXISTS "anon_insert_bookings" ON bookings;
CREATE POLICY "anon_insert_bookings" ON bookings
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Admin: authenticated users can read all bookings
DROP POLICY IF EXISTS "admin_select_bookings" ON bookings;
CREATE POLICY "admin_select_bookings" ON bookings
  FOR SELECT TO authenticated
  USING (true);

-- Admin: authenticated users can update any booking
DROP POLICY IF EXISTS "admin_update_bookings" ON bookings;
CREATE POLICY "admin_update_bookings" ON bookings
  FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

-- Admin: authenticated users can delete bookings
DROP POLICY IF EXISTS "admin_delete_bookings" ON bookings;
CREATE POLICY "admin_delete_bookings" ON bookings
  FOR DELETE TO authenticated
  USING (true);
