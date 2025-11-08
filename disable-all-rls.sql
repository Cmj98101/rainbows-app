-- Comprehensive RLS Fix
-- Since the app uses service role key (bypasses RLS), disable RLS on all tables
-- The application-level permission checks in API routes handle all security

-- Drop all policies that reference the deleted functions
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname
              FROM pg_policies
              WHERE schemaname = 'public')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I CASCADE',
                      r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- Disable RLS on all tables
ALTER TABLE IF EXISTS churches DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS class_teachers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS students DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS guardians DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tests DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS test_results DISABLE ROW LEVEL SECURITY;

-- Verify
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
