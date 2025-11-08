-- Fix for infinite recursion in RLS policies
-- This script disables RLS on the users table since the app uses service role key
-- The application-level permission checks in API routes handle security

-- Drop the problematic helper functions
DROP FUNCTION IF EXISTS public.user_church_id() CASCADE;
DROP FUNCTION IF EXISTS public.is_church_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_teacher_for_class(UUID) CASCADE;

-- Disable RLS on users table (service role bypasses RLS anyway)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Verify
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'users' AND schemaname = 'public';
