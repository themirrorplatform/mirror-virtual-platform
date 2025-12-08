-- =============================================================================
-- Add Username Column to public.profiles
-- =============================================================================
-- This migration adds the username column that was missing from 001_mirror_core.sql
-- Your code expects username but the original schema didn't include it.

-- Add username column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'username'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN username text UNIQUE;
        
        RAISE NOTICE 'Added username column to public.profiles';
    ELSE
        RAISE NOTICE 'Username column already exists in public.profiles';
    END IF;
END $$;

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- Verify the table structure
DO $$
DECLARE
    column_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'username'
    ) INTO column_exists;
    
    IF column_exists THEN
        RAISE NOTICE '✅ SUCCESS: public.profiles now has username column';
    ELSE
        RAISE EXCEPTION '❌ FAILED: username column was not added';
    END IF;
END $$;

-- Show current table structure
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE 'Current public.profiles structure:';
    FOR rec IN 
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'profiles'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  - %: % (nullable: %, default: %)', 
            rec.column_name, rec.data_type, rec.is_nullable, rec.column_default;
    END LOOP;
END $$;
