-- ============================================
-- Hope A Life International - Supabase Schema
-- ============================================
-- This file contains all database tables needed for the admin panel
-- Run this in Supabase SQL Editor to create all tables
-- ============================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. TESTIMONIALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS testimonials (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT,
    quote TEXT NOT NULL,
    tags TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. PHOTOS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS photos (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    url TEXT NOT NULL, -- Can be base64 data URL or external URL
    alt TEXT,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. VIDEOS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS videos (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    url TEXT NOT NULL,
    thumbnail TEXT,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS events (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    time TIME,
    location TEXT,
    description TEXT,
    venue TEXT,
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    image TEXT, -- Can be base64 data URL or external URL
    registration_link TEXT,
    featured BOOLEAN DEFAULT FALSE,
    max_attendees INTEGER DEFAULT 0, -- 0 means unlimited
    max_attendees_per_organization INTEGER,
    documents JSONB DEFAULT '[]'::jsonb, -- Array of document objects
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. EVENT REGISTRATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS event_registrations (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    registration_type TEXT NOT NULL CHECK (registration_type IN ('individual', 'organization')),
    
    -- Individual registration fields
    registrant_name TEXT,
    registrant_email TEXT,
    registrant_phone TEXT,
    
    -- Organization registration fields
    organization_name TEXT,
    contact_person TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    number_of_attendees INTEGER NOT NULL DEFAULT 1,
    
    -- Attendee details (stored as JSON array)
    attendee_details JSONB DEFAULT '[]'::jsonb,
    
    -- Additional information
    special_requirements TEXT,
    dietary_restrictions TEXT,
    additional_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 6. NEWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS news (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image TEXT,
    link TEXT,
    source TEXT,
    author TEXT,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 7. PENDING NEWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS pending_news (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image TEXT,
    link TEXT,
    source TEXT,
    author TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- ============================================
-- 8. PUBLICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS publications (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author TEXT,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    images JSONB DEFAULT '[]'::jsonb, -- Array of image URLs/data URLs
    videos JSONB DEFAULT '[]'::jsonb, -- Array of video URLs/data URLs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 9. QUOTES TABLE (Daily Quotes)
-- ============================================
CREATE TABLE IF NOT EXISTS daily_quotes (
    id BIGSERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    author TEXT,
    date DATE, -- Optional: for scheduling quotes on specific dates
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 10. VERSES TABLE (Daily Verses)
-- ============================================
CREATE TABLE IF NOT EXISTS daily_verses (
    id BIGSERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    reference TEXT, -- Bible reference (e.g., "John 3:16")
    date DATE, -- Optional: for scheduling verses on specific dates
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 11. PENDING STORIES TABLE (User-submitted testimonials)
-- ============================================
CREATE TABLE IF NOT EXISTS pending_stories (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT,
    quote TEXT NOT NULL,
    tags TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by TEXT
);

-- ============================================
-- 12. EMAIL LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS email_logs (
    id BIGSERIAL PRIMARY KEY,
    recipient_email TEXT NOT NULL,
    subject TEXT,
    message TEXT,
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending')),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    error_message TEXT
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Events indexes
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_featured ON events(featured) WHERE featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC);

-- Event registrations indexes
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_created_at ON event_registrations(created_at DESC);

-- News indexes
CREATE INDEX IF NOT EXISTS idx_news_date ON news(date DESC);
CREATE INDEX IF NOT EXISTS idx_news_created_at ON news(created_at DESC);

-- Pending news indexes
CREATE INDEX IF NOT EXISTS idx_pending_news_status ON pending_news(status);
CREATE INDEX IF NOT EXISTS idx_pending_news_submitted_at ON pending_news(submitted_at DESC);

-- Publications indexes
CREATE INDEX IF NOT EXISTS idx_publications_date ON publications(date DESC);
CREATE INDEX IF NOT EXISTS idx_publications_created_at ON publications(created_at DESC);

-- Quotes and verses indexes
CREATE INDEX IF NOT EXISTS idx_daily_quotes_date ON daily_quotes(date);
CREATE INDEX IF NOT EXISTS idx_daily_verses_date ON daily_verses(date);

-- Pending stories indexes
CREATE INDEX IF NOT EXISTS idx_pending_stories_status ON pending_stories(status);
CREATE INDEX IF NOT EXISTS idx_pending_stories_submitted_at ON pending_stories(submitted_at DESC);

-- Photos indexes
CREATE INDEX IF NOT EXISTS idx_photos_date ON photos(date DESC);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at DESC);

-- Videos indexes
CREATE INDEX IF NOT EXISTS idx_videos_date ON videos(date DESC);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);

-- ============================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_testimonials_updated_at BEFORE UPDATE ON testimonials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_photos_updated_at BEFORE UPDATE ON photos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_registrations_updated_at BEFORE UPDATE ON event_registrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_news_updated_at BEFORE UPDATE ON news
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_publications_updated_at BEFORE UPDATE ON publications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_quotes_updated_at BEFORE UPDATE ON daily_quotes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_verses_updated_at BEFORE UPDATE ON daily_verses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
-- Enable RLS on all tables (you can adjust these policies based on your needs)

-- For now, we'll enable RLS but allow all operations
-- You should customize these based on your authentication setup

ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_verses ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Public read access (for website visitors)
-- Admin write access (you'll need to set up authentication first)
-- For now, allow all operations - you can restrict later

-- Example: Allow public read access
CREATE POLICY "Public read access" ON testimonials FOR SELECT USING (true);
CREATE POLICY "Public read access" ON photos FOR SELECT USING (true);
CREATE POLICY "Public read access" ON videos FOR SELECT USING (true);
CREATE POLICY "Public read access" ON events FOR SELECT USING (true);
CREATE POLICY "Public read access" ON news FOR SELECT USING (true);
CREATE POLICY "Public read access" ON publications FOR SELECT USING (true);
CREATE POLICY "Public read access" ON daily_quotes FOR SELECT USING (true);
CREATE POLICY "Public read access" ON daily_verses FOR SELECT USING (true);

-- Allow all operations for now (you'll restrict this later with proper auth)
CREATE POLICY "Allow all operations" ON testimonials FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON photos FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON videos FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON events FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON event_registrations FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON news FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON pending_news FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON publications FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON daily_quotes FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON daily_verses FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON pending_stories FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON email_logs FOR ALL USING (true);

-- ============================================
-- NOTES
-- ============================================
-- 1. After running this schema, go to Supabase Dashboard > Settings > API
--    to get your Project URL and anon/public key
--
-- 2. For production, you should:
--    - Set up proper authentication (Supabase Auth)
--    - Restrict RLS policies to authenticated admin users only
--    - Consider using Supabase Storage for images/videos instead of base64
--
-- 3. For large images/videos, consider using Supabase Storage:
--    - Create a storage bucket for photos
--    - Create a storage bucket for videos
--    - Store file paths in the database instead of base64 data
--
-- 4. The documents field in events table stores JSON array of document objects
--    Consider using Supabase Storage for documents as well
--
-- 5. Next steps:
--    a) Run this SQL in Supabase SQL Editor
--    b) Get your API credentials from Supabase Dashboard
--    c) Update your admin.js to use Supabase client instead of localStorage
--    d) Update all loader scripts to fetch from Supabase
--    e) Set up real-time subscriptions for instant updates

