/*
# Subscriber Offers & Notifications System

## Summary
Creates a `subscriber_offers` table that stores promotional offers, importance
messages, why-choose-us highlights, and donation reminders. These are pushed to
subscribed users via browser notifications on a rotating schedule. The system
ensures that every user who enables notifications regularly receives offers
about the importance of the services, why they should choose us, and donation
reminders.

## New Tables

### subscriber_offers
Stores the offer/notification content that gets rotated to subscribers.
- id (uuid, primary key)
- type (text) — 'offer' | 'importance' | 'why_us' | 'donation' | 'quote'
- title (text) — notification title
- body (text) — notification body text
- link (text, optional) — URL to navigate to when clicked
- active (boolean, default true) — only active offers are sent
- created_at (timestamptz)

### notification_log
Tracks which offers have been sent to which users to avoid duplicates.
- id (uuid, primary key)
- user_id (uuid, FK to auth.users)
- offer_id (uuid, FK to subscriber_offers)
- sent_at (timestamptz)

## Security
- RLS enabled on both tables.
- subscriber_offers: readable by all (anon + authenticated) so the frontend
  can fetch the current offer. INSERT/UPDATE/DELETE is admin-only (authenticated
  users cannot modify offers).
- notification_log: owner-scoped — users can only see their own logs.

## Important Notes
1. The frontend fetches the next un-sent offer for the current user and
   displays it as a browser notification on a periodic timer.
2. Offers rotate through types: service offers, importance messages,
   why-choose-us highlights, and donation reminders.
3. The system ensures variety by tracking which offers each user has already
   received.
*/

-- ── subscriber_offers ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriber_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('offer', 'importance', 'why_us', 'donation', 'quote')),
  title text NOT NULL,
  body text NOT NULL,
  link text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subscriber_offers ENABLE ROW LEVEL SECURITY;

-- Everyone can read offers (they are promotional content)
DROP POLICY IF EXISTS "read_subscriber_offers" ON subscriber_offers;
CREATE POLICY "read_subscriber_offers" ON subscriber_offers FOR SELECT
  TO anon, authenticated USING (true);

-- Only service role can modify offers (admin manages via SQL or admin panel)
-- No INSERT/UPDATE/DELETE policies for anon or authenticated

-- ── notification_log ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  offer_id uuid NOT NULL REFERENCES subscriber_offers(id) ON DELETE CASCADE,
  sent_at timestamptz DEFAULT now()
);

ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_notification_log_user ON notification_log(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_user_offer ON notification_log(user_id, offer_id);

DROP POLICY IF EXISTS "select_own_notification_log" ON notification_log;
CREATE POLICY "select_own_notification_log" ON notification_log FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_notification_log" ON notification_log;
CREATE POLICY "insert_own_notification_log" ON notification_log FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_notification_log" ON notification_log;
CREATE POLICY "delete_own_notification_log" ON notification_log FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ── Seed initial offers ───────────────────────────────────────────────────────
INSERT INTO subscriber_offers (type, title, body, link) VALUES
  -- Offers
  ('offer', 'Special Offer: 20% Off Web Design!', 'Get a professional website for your business at 20% off this month. Limited slots available.', '#services'),
  ('offer', 'Free CV Review This Week', 'Submit your CV and get a free professional review. Stand out in your job search!', '#services'),
  ('offer', 'Bundle Deal: KRA + Business Registration', 'Register your KRA PIN and business name together and save. Fast turnaround guaranteed.', '#services'),
  ('offer', 'Student Discount: 15% Off Academic Services', 'Students get 15% off all academic research, thesis formatting, and typing services.', '#services'),

  -- Importance
  ('importance', 'Why Cybersecurity Matters Now', 'Cyber attacks cost businesses millions. Protect your data and your future with professional cybersecurity training.', '#why-us'),
  ('importance', 'Your Digital Presence Is Your First Impression', '75% of customers judge a business by its website. Make yours count with professional web design.', '#why-us'),
  ('importance', 'Don''t Lose Your Data', 'Data loss can happen anytime. Set up automated backups and cloud storage before it''s too late.', '#why-us'),
  ('importance', 'KRA Deadlines Don''t Wait', 'Missing KRA returns means penalties. Let us handle your tax compliance while you focus on your business.', '#why-us'),

  -- Why Us
  ('why_us', 'Trusted by 5,000+ Kenyan Students', 'Join thousands who have transformed their academic and professional journey with Prince Services.', '#why-us'),
  ('why_us', 'Fast 30-Minute Response Time', 'We respond to every booking within 30 minutes. No waiting, no delays — just fast, professional service.', '#why-us'),
  ('why_us', '100% Confidential & Secure', 'Your data is protected with enterprise-grade security. We never share your information with anyone.', '#why-us'),
  ('why_us', 'Expert Team, Affordable Prices', 'Get professional-grade services at student-friendly prices. Quality doesn''t have to break the bank.', '#why-us'),

  -- Donations
  ('donation', 'Fuel a Student''s Future', 'Your donation helps students who can''t afford essential services. Every contribution makes a difference.', '#donate'),
  ('donation', 'Help Us Reach More Students', 'We provide free services to students in need. Your support keeps this mission alive.', '#donate'),
  ('donation', 'Be the Reason Someone Succeeds', 'A small donation can help a student get their CV, KRA PIN, or business registration. Change a life today.', '#donate'),

  -- Quotes (success quotes)
  ('quote', 'Keep Going!', 'Success is not final, failure is not fatal. It is the courage to continue that counts.', null),
  ('quote', 'You''ve Got This!', 'Believe you can and you''re halfway there. Keep pushing forward!', null),
  ('quote', 'Stay Focused', 'The only way to do great work is to love what you do. Stay passionate!', null),
  ('quote', 'Dream Big', 'Your limitation—it''s only your imagination. Push your limits!', null),
  ('quote', 'Be Unstoppable', 'Don''t stop when you''re tired. Stop when you''re done!', null)
ON CONFLICT DO NOTHING;
