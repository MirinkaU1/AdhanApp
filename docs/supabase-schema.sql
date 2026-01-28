-- =============================================================================
-- MAPRIÈRE DATABASE SCHEMA
-- =============================================================================
-- Run this SQL in your Supabase SQL Editor to set up the database.
-- This creates the necessary tables with Row Level Security (RLS) policies.
-- =============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- TABLE: profiles
-- =============================================================================
-- Stores user profile information (for both anonymous and registered users)
-- NOTE: Email & password are stored in auth.users (managed by Supabase)
-- We only store additional profile data here

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT,
    email TEXT,  -- Copie pour affichage (l'original est dans auth.users)
    avatar_url TEXT,
    birth_date DATE,  -- Date de naissance
    is_anonymous BOOLEAN DEFAULT TRUE,
    auth_provider TEXT DEFAULT 'anonymous',  -- 'anonymous', 'email', 'google', 'facebook', 'apple'
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    is_supporter BOOLEAN DEFAULT FALSE,
    streak_current INTEGER DEFAULT 0,
    streak_best INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_supporter ON public.profiles(is_supporter);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles (drop existing first to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Users can only view their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- =============================================================================
-- TABLE: daily_logs
-- =============================================================================
-- Stores daily prayer tracking for each user

CREATE TABLE IF NOT EXISTS public.daily_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    fajr BOOLEAN DEFAULT FALSE,
    dhuhr BOOLEAN DEFAULT FALSE,
    asr BOOLEAN DEFAULT FALSE,
    maghrib BOOLEAN DEFAULT FALSE,
    isha BOOLEAN DEFAULT FALSE,
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint: one log per user per date
    CONSTRAINT unique_user_date UNIQUE (user_id, date)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_id ON public.daily_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON public.daily_logs(date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON public.daily_logs(user_id, date DESC);

-- Enable RLS
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily_logs (drop existing first to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own logs" ON public.daily_logs;
DROP POLICY IF EXISTS "Users can insert own logs" ON public.daily_logs;
DROP POLICY IF EXISTS "Users can update own logs" ON public.daily_logs;
DROP POLICY IF EXISTS "Users can delete own logs" ON public.daily_logs;

-- Users can only view their own logs
CREATE POLICY "Users can view own logs"
    ON public.daily_logs FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own logs
CREATE POLICY "Users can insert own logs"
    ON public.daily_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own logs
CREATE POLICY "Users can update own logs"
    ON public.daily_logs FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own logs (optional, for data cleanup)
CREATE POLICY "Users can delete own logs"
    ON public.daily_logs FOR DELETE
    USING (auth.uid() = user_id);

-- =============================================================================
-- TABLE: donations (optional - for tracking donation history)
-- =============================================================================
-- Stores donation records for supporter tracking

CREATE TABLE IF NOT EXISTS public.donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tier_id TEXT NOT NULL, -- 'bronze', 'silver', 'gold'
    amount_cents INTEGER NOT NULL,
    currency TEXT DEFAULT 'XOF',
    revenuecat_transaction_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_donations_user_id ON public.donations(user_id);

-- Enable RLS
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for donations (drop existing first to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own donations" ON public.donations;
DROP POLICY IF EXISTS "Users can insert own donations" ON public.donations;

CREATE POLICY "Users can view own donations"
    ON public.donations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own donations"
    ON public.donations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- FUNCTION: Auto-update updated_at timestamp
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to profiles table
DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- NOTE: Profile creation is handled by the app after signup
-- =============================================================================
-- We don't use a trigger because it can cause "Database error saving new user"
-- The app creates the profile in signUpWithEmail() after auth.signUp() succeeds
-- This is more reliable and gives us full control over the profile data

-- =============================================================================
-- FUNCTION: Calculate and update streak
-- =============================================================================

CREATE OR REPLACE FUNCTION public.calculate_streak(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_streak INTEGER := 0;
    v_current_date DATE := CURRENT_DATE;
    v_log_exists BOOLEAN;
    v_all_prayed BOOLEAN;
BEGIN
    LOOP
        -- Check if log exists for this date
        SELECT 
            EXISTS(SELECT 1 FROM public.daily_logs WHERE user_id = p_user_id AND date = v_current_date),
            (fajr AND dhuhr AND asr AND maghrib AND isha)
        INTO v_log_exists, v_all_prayed
        FROM public.daily_logs 
        WHERE user_id = p_user_id AND date = v_current_date;
        
        -- If no log or not all prayers completed, stop
        IF NOT v_log_exists OR NOT COALESCE(v_all_prayed, FALSE) THEN
            EXIT;
        END IF;
        
        v_streak := v_streak + 1;
        v_current_date := v_current_date - INTERVAL '1 day';
    END LOOP;
    
    -- Update profile with current streak
    UPDATE public.profiles 
    SET 
        streak_current = v_streak,
        streak_best = GREATEST(streak_best, v_streak)
    WHERE id = p_user_id;
    
    RETURN v_streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- GRANTS (ensure authenticated users can access)
-- =============================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.daily_logs TO authenticated;
GRANT ALL ON public.donations TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_streak(UUID) TO authenticated;

-- =============================================================================
-- VERIFICATION QUERIES (optional - run to check setup)
-- =============================================================================

-- Check tables exist:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Check policies:
-- SELECT * FROM pg_policies WHERE schemaname = 'public';
