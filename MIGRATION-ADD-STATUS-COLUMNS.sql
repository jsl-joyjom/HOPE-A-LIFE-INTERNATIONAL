-- ============================================
-- Migration: Add Status Columns to Existing Tables
-- ============================================
-- Run this in Supabase SQL Editor if your tables already exist
-- This adds status columns to quotes, verses, and news tables
-- ============================================

-- Add status column to daily_quotes if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'daily_quotes' AND column_name = 'status'
    ) THEN
        ALTER TABLE daily_quotes 
        ADD COLUMN status TEXT DEFAULT 'published' 
        CHECK (status IN ('draft', 'published'));
        
        -- Update all existing quotes to published
        UPDATE daily_quotes SET status = 'published' WHERE status IS NULL;
    END IF;
END $$;

-- Add status column to daily_verses if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'daily_verses' AND column_name = 'status'
    ) THEN
        ALTER TABLE daily_verses 
        ADD COLUMN status TEXT DEFAULT 'published' 
        CHECK (status IN ('draft', 'published'));
        
        -- Update all existing verses to published
        UPDATE daily_verses SET status = 'published' WHERE status IS NULL;
    END IF;
END $$;

-- Add status column to news if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'news' AND column_name = 'status'
    ) THEN
        ALTER TABLE news 
        ADD COLUMN status TEXT DEFAULT 'published' 
        CHECK (status IN ('draft', 'published'));
        
        -- Update all existing news to published
        UPDATE news SET status = 'published' WHERE status IS NULL;
    END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_daily_quotes_status ON daily_quotes(status);
CREATE INDEX IF NOT EXISTS idx_daily_verses_status ON daily_verses(status);
CREATE INDEX IF NOT EXISTS idx_news_status ON news(status);

-- ============================================
-- Verification Query
-- ============================================
-- Run this to verify the columns were added:
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name IN ('daily_quotes', 'daily_verses', 'news') 
-- AND column_name = 'status';

