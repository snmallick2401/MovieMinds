-- Migration: 0002_enable_rls.sql
-- Enables Row Level Security (RLS) on all public tables created by Prisma.
-- This resolves the 24 "RLS Disabled in Public" security vulnerabilities reported by Supabase Advisor.
--
-- Background:
-- Prisma connects via direct database connection (DATABASE_URL / DIRECT_URL) as the `postgres` user,
-- which bypasses RLS by default. Enabling RLS blocks unauthorized direct access to your data
-- via Supabase PostgREST (Data API) using the public `anon` key.

-- ============================================================================
-- 1. Explicitly Enable RLS on all 25 Application Tables
-- ============================================================================

ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.media_genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.streaming_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.media_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.catalog_syncs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.watch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.media_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.discussion_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.discussion_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.discussion_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.discussion_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.thread_watches ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.news_articles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. Catch-all: Ensure RLS is active for any existing & future public tables
-- ============================================================================

DO $$
DECLARE
    tbl RECORD;
BEGIN
    FOR tbl IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename NOT LIKE '_prisma_%'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl.tablename);
    END LOOP;
END $$;
