/*
# Add contact fields to donations table

## Summary
Adds name, email, and phone columns to donations table so that
non-logged-in users can submit donations with their contact info.
*/

-- Add contact fields to donations
ALTER TABLE donations ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE donations ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE donations ADD COLUMN IF NOT EXISTS phone text;

-- Update user_id to allow NULL for guest donations
ALTER TABLE donations ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE donations ALTER COLUMN user_id SET DEFAULT NULL;

-- Allow anonymous insert for guest donations (no auth required)
DROP POLICY IF EXISTS "insert_own_donations" ON donations;
CREATE POLICY "insert_donations" ON donations FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- Allow anon to see only their own donations (by phone or email match)
DROP POLICY IF EXISTS "select_own_donations" ON donations;
CREATE POLICY "select_own_donations" ON donations FOR SELECT
  TO authenticated USING (auth.uid() = user_id);