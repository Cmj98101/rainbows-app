-- Check RLS status for all tables
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check all policies (this will fail if they reference dropped functions)
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
