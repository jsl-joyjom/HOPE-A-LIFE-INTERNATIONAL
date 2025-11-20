-- Migration: Add status column to daily_verses, daily_quotes, and news tables if they don't exist
-- Run this in Supabase SQL Editor if you get "Could not find the 'status' column" error

-- Add status column to daily_verses if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'daily_verses' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE daily_verses 
        ADD COLUMN status TEXT DEFAULT 'published' 
        CHECK (status IN ('draft', 'published'));
        
        -- Update existing rows to have 'published' status
        UPDATE daily_verses SET status = 'published' WHERE status IS NULL;
    END IF;
END $$;

-- Add status column to daily_quotes if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'daily_quotes' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE daily_quotes 
        ADD COLUMN status TEXT DEFAULT 'published' 
        CHECK (status IN ('draft', 'published'));
        
        -- Update existing rows to have 'published' status
        UPDATE daily_quotes SET status = 'published' WHERE status IS NULL;
    END IF;
END $$;

-- Add status column to news if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'news' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE news 
        ADD COLUMN status TEXT DEFAULT 'published' 
        CHECK (status IN ('draft', 'published'));
        
        -- Update existing rows to have 'published' status
        UPDATE news SET status = 'published' WHERE status IS NULL;
    END IF;
END $$;

