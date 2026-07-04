/*
# Add User Accounts, Donations, Library Resources & Private Spaces

## Summary
Adds a full user-facing account system on top of the existing admin/bookings schema.
Signed-in users can track their bookings, log donations, save library resources,
bookmark updates articles, and keep private notes — all scoped to their own account.
Profile pictures are stored as Supabase Storage object paths.

## New Tables
- profiles (extends auth.users with full_name, phone, avatar_path)
- donations (per-user M-Pesa donation logs)
- library_resources (public catalog of guides/books/templates)
- library_saves (per-user private saved library items)
- update_bookmarks (per-user private bookmarked articles)
- private_notes (per-user private workspace notes)

## Security
- RLS enabled on every new table.
- profiles: owner-scoped SELECT/UPDATE; row auto-created via trigger on auth.users.
- donations, library_saves, update_bookmarks, private_notes: owner-scoped CRUD.
- library_resources: public read, no public write.
- Storage bucket 'avatars' created with owner-scoped policies.
- bookings: optional user_id column added so logged-in users can see their own bookings.
*/

-- ── profiles ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  avatar_path text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Auto-create a profile row when a new auth.users record is created
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO profiles (id, full_name, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'phone')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── donations ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  mpesa_code text,
  note text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_donations" ON donations;
CREATE POLICY "select_own_donations" ON donations FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_donations" ON donations;
CREATE POLICY "insert_own_donations" ON donations FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_donations" ON donations;
CREATE POLICY "update_own_donations" ON donations FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_donations" ON donations;
CREATE POLICY "delete_own_donations" ON donations FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ── library_resources (public catalog) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS library_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text,
  resource_url text,
  cover_image text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE library_resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_library_resources" ON library_resources;
CREATE POLICY "public_read_library_resources" ON library_resources FOR SELECT
  TO anon, authenticated USING (true);

INSERT INTO library_resources (title, description, category, resource_url, cover_image)
SELECT * FROM (VALUES
  ('HELB Application Guide 2025', 'Complete step-by-step guide to applying for your HELB loan.', 'Education', '#', 'https://images.pexels.com/photos/4145190/pexels-photo-4145190.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('KUCCPS Placement Handbook', 'Everything about KUCCPS revision, placement and transfers.', 'Education', '#', 'https://images.pexels.com/photos/1205651/pexels-photo-1205651.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('KRA iTax Filing Guide', 'How to file your KRA returns on iTax without penalties.', 'Government', '#', 'https://images.pexels.com/photos/6863332/pexels-photo-6863332.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('ATS-Optimized CV Template', 'Modern CV template that beats applicant tracking systems.', 'Career', '#', 'https://images.pexels.com/photos/3760072/pexels-photo-3760072.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('Cybersecurity Basics for Students', 'Protect yourself online with these digital hygiene practices.', 'Cybersecurity', '#', 'https://images.pexels.com/photos/60504/security-protection-anti-virus-software-60504.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('Certificate of Good Conduct Guide', 'Step-by-step eCitizen application walkthrough.', 'Government', '#', 'https://images.pexels.com/photos/5668858/pexels-photo-5668858.jpeg?auto=compress&cs=tinysrgb&w=800')
) AS t(title, description, category, resource_url, cover_image)
WHERE NOT EXISTS (SELECT 1 FROM library_resources LIMIT 1);

-- ── library_saves (private per user) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS library_saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_id uuid REFERENCES library_resources(id) ON DELETE CASCADE,
  saved_at timestamptz DEFAULT now(),
  UNIQUE (user_id, resource_id)
);

ALTER TABLE library_saves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_library_saves" ON library_saves;
CREATE POLICY "select_own_library_saves" ON library_saves FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_library_saves" ON library_saves;
CREATE POLICY "insert_own_library_saves" ON library_saves FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_library_saves" ON library_saves;
CREATE POLICY "delete_own_library_saves" ON library_saves FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ── update_bookmarks (private per user) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS update_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  excerpt text,
  category text,
  image_url text,
  bookmarked_at timestamptz DEFAULT now()
);

ALTER TABLE update_bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_bookmarks" ON update_bookmarks;
CREATE POLICY "select_own_bookmarks" ON update_bookmarks FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_bookmarks" ON update_bookmarks;
CREATE POLICY "insert_own_bookmarks" ON update_bookmarks FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_bookmarks" ON update_bookmarks;
CREATE POLICY "delete_own_bookmarks" ON update_bookmarks FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ── private_notes (per-user workspace) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS private_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  scope text NOT NULL DEFAULT 'general' CHECK (scope IN ('library', 'updates', 'general')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE private_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_notes" ON private_notes;
CREATE POLICY "select_own_notes" ON private_notes FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_notes" ON private_notes;
CREATE POLICY "insert_own_notes" ON private_notes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_notes" ON private_notes;
CREATE POLICY "update_own_notes" ON private_notes FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_notes" ON private_notes;
CREATE POLICY "delete_own_notes" ON private_notes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_notes_updated_at ON private_notes;
CREATE TRIGGER set_notes_updated_at
  BEFORE UPDATE ON private_notes
  FOR EACH ROW EXECUTE FUNCTION update_notes_updated_at();

-- ── Link existing bookings to auth users ───────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'bookings' AND column_name = 'user_id') THEN
    ALTER TABLE bookings ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

DROP POLICY IF EXISTS "select_own_bookings_by_user" ON bookings;
CREATE POLICY "select_own_bookings_by_user" ON bookings FOR SELECT
  TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "insert_own_bookings" ON bookings;
CREATE POLICY "insert_own_bookings" ON bookings FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

-- ── Storage bucket for avatars ─────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
SELECT 'avatars', 'avatars', true
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'avatars');

DROP POLICY IF EXISTS "read_avatars" ON storage.objects;
CREATE POLICY "read_avatars" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "insert_own_avatar" ON storage.objects;
CREATE POLICY "insert_own_avatar" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "update_own_avatar" ON storage.objects;
CREATE POLICY "update_own_avatar" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "delete_own_avatar" ON storage.objects;
CREATE POLICY "delete_own_avatar" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
