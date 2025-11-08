-- ============================================================================
-- Row Level Security (RLS) Policies for Multi-Tenant Rainbows App
-- ============================================================================
--
-- This file contains all RLS policies needed for proper security and
-- multi-tenant isolation. Run this in your Supabase SQL Editor.
--
-- IMPORTANT: These policies work in conjunction with the service role key
-- used in the backend. The backend uses the service role to bypass RLS,
-- so the application logic in the API routes handles the permission checks.
--
-- These policies are an additional security layer for client-side access
-- and to prevent accidental data leaks.
-- ============================================================================

-- ============================================================================
-- 1. CHURCHES TABLE
-- ============================================================================

-- Enable RLS
ALTER TABLE churches ENABLE ROW LEVEL SECURITY;

-- Church admins can view their own church
CREATE POLICY "Users can view their own church"
  ON churches
  FOR SELECT
  USING (
    id IN (
      SELECT church_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- Church admins can update their own church
CREATE POLICY "Church admins can update their church"
  ON churches
  FOR UPDATE
  USING (
    id IN (
      SELECT church_id
      FROM users
      WHERE id = auth.uid()
        AND role = 'church_admin'
    )
  );

-- Anyone can create a church (for onboarding)
CREATE POLICY "Anyone can create a church"
  ON churches
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- 2. USERS TABLE
-- ============================================================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can view other users in their church
CREATE POLICY "Users can view users in their church"
  ON users
  FOR SELECT
  USING (
    church_id IN (
      SELECT church_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- Users with canManageUsers can insert users
CREATE POLICY "Users with canManageUsers can insert users"
  ON users
  FOR INSERT
  WITH CHECK (
    church_id IN (
      SELECT church_id
      FROM users
      WHERE id = auth.uid()
        AND (
          permissions->>'canManageUsers' = 'true'
          OR role = 'church_admin'
        )
    )
  );

-- Users with canManageUsers can update users
CREATE POLICY "Users with canManageUsers can update users"
  ON users
  FOR UPDATE
  USING (
    church_id IN (
      SELECT church_id
      FROM users
      WHERE id = auth.uid()
        AND (
          permissions->>'canManageUsers' = 'true'
          OR role = 'church_admin'
        )
    )
  );

-- Users with canManageUsers can delete users
CREATE POLICY "Users with canManageUsers can delete users"
  ON users
  FOR DELETE
  USING (
    church_id IN (
      SELECT church_id
      FROM users
      WHERE id = auth.uid()
        AND (
          permissions->>'canManageUsers' = 'true'
          OR role = 'church_admin'
        )
    )
  );

-- ============================================================================
-- 3. CLASSES TABLE
-- ============================================================================

-- Enable RLS
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- Users can view classes in their church
CREATE POLICY "Users can view classes in their church"
  ON classes
  FOR SELECT
  USING (
    church_id IN (
      SELECT church_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- Users with canManageClasses can insert classes
CREATE POLICY "Users with canManageClasses can insert classes"
  ON classes
  FOR INSERT
  WITH CHECK (
    church_id IN (
      SELECT church_id
      FROM users
      WHERE id = auth.uid()
        AND (
          permissions->>'canManageClasses' = 'true'
          OR role IN ('admin', 'church_admin')
        )
    )
  );

-- Users with canManageClasses can update classes
CREATE POLICY "Users with canManageClasses can update classes"
  ON classes
  FOR UPDATE
  USING (
    church_id IN (
      SELECT church_id
      FROM users
      WHERE id = auth.uid()
        AND (
          permissions->>'canManageClasses' = 'true'
          OR role IN ('admin', 'church_admin')
        )
    )
  );

-- Users with canManageClasses can delete classes
CREATE POLICY "Users with canManageClasses can delete classes"
  ON classes
  FOR DELETE
  USING (
    church_id IN (
      SELECT church_id
      FROM users
      WHERE id = auth.uid()
        AND (
          permissions->>'canManageClasses' = 'true'
          OR role IN ('admin', 'church_admin')
        )
    )
  );

-- ============================================================================
-- 4. CLASS_TEACHERS TABLE
-- ============================================================================

-- Enable RLS
ALTER TABLE class_teachers ENABLE ROW LEVEL SECURITY;

-- Users can view class-teacher assignments in their church
CREATE POLICY "Users can view class teachers in their church"
  ON class_teachers
  FOR SELECT
  USING (
    class_id IN (
      SELECT id
      FROM classes
      WHERE church_id IN (
        SELECT church_id
        FROM users
        WHERE id = auth.uid()
      )
    )
  );

-- Users with canManageClasses can insert assignments
CREATE POLICY "Users with canManageClasses can assign teachers"
  ON class_teachers
  FOR INSERT
  WITH CHECK (
    class_id IN (
      SELECT id
      FROM classes
      WHERE church_id IN (
        SELECT church_id
        FROM users
        WHERE id = auth.uid()
          AND (
            permissions->>'canManageClasses' = 'true'
            OR role IN ('admin', 'church_admin')
          )
      )
    )
  );

-- Users with canManageClasses can delete assignments
CREATE POLICY "Users with canManageClasses can remove teachers"
  ON class_teachers
  FOR DELETE
  USING (
    class_id IN (
      SELECT id
      FROM classes
      WHERE church_id IN (
        SELECT church_id
        FROM users
        WHERE id = auth.uid()
          AND (
            permissions->>'canManageClasses' = 'true'
            OR role IN ('admin', 'church_admin')
          )
      )
    )
  );

-- ============================================================================
-- 5. STUDENTS TABLE
-- ============================================================================

-- Enable RLS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Admins can view all students in their church
-- Teachers can only view students in their assigned classes
CREATE POLICY "Users can view students"
  ON students
  FOR SELECT
  USING (
    church_id IN (
      SELECT church_id
      FROM users
      WHERE id = auth.uid()
    )
    AND (
      -- Admins and church admins can see all students
      EXISTS (
        SELECT 1
        FROM users
        WHERE id = auth.uid()
          AND role IN ('admin', 'church_admin')
      )
      OR
      -- Teachers can only see students in their assigned classes
      class_id IN (
        SELECT class_id
        FROM class_teachers
        WHERE teacher_id = auth.uid()
      )
    )
  );

-- Users with canEditStudents can insert students
CREATE POLICY "Users with canEditStudents can insert students"
  ON students
  FOR INSERT
  WITH CHECK (
    church_id IN (
      SELECT church_id
      FROM users
      WHERE id = auth.uid()
        AND (
          permissions->>'canEditStudents' = 'true'
          OR role IN ('admin', 'church_admin')
        )
    )
  );

-- Users with canEditStudents can update students
CREATE POLICY "Users with canEditStudents can update students"
  ON students
  FOR UPDATE
  USING (
    church_id IN (
      SELECT church_id
      FROM users
      WHERE id = auth.uid()
        AND (
          permissions->>'canEditStudents' = 'true'
          OR role IN ('admin', 'church_admin')
        )
    )
  );

-- Users with canEditStudents can delete students
CREATE POLICY "Users with canEditStudents can delete students"
  ON students
  FOR DELETE
  USING (
    church_id IN (
      SELECT church_id
      FROM users
      WHERE id = auth.uid()
        AND (
          permissions->>'canEditStudents' = 'true'
          OR role IN ('admin', 'church_admin')
        )
    )
  );

-- ============================================================================
-- 6. GUARDIANS TABLE
-- ============================================================================

-- Enable RLS
ALTER TABLE guardians ENABLE ROW LEVEL SECURITY;

-- Users can view guardians for students they can see
CREATE POLICY "Users can view guardians for their students"
  ON guardians
  FOR SELECT
  USING (
    student_id IN (
      SELECT id
      FROM students
      WHERE church_id IN (
        SELECT church_id
        FROM users
        WHERE id = auth.uid()
      )
    )
  );

-- Users with canEditStudents can insert guardians
CREATE POLICY "Users with canEditStudents can insert guardians"
  ON guardians
  FOR INSERT
  WITH CHECK (
    student_id IN (
      SELECT id
      FROM students
      WHERE church_id IN (
        SELECT church_id
        FROM users
        WHERE id = auth.uid()
          AND (
            permissions->>'canEditStudents' = 'true'
            OR role IN ('admin', 'church_admin')
          )
      )
    )
  );

-- Users with canEditStudents can update guardians
CREATE POLICY "Users with canEditStudents can update guardians"
  ON guardians
  FOR UPDATE
  USING (
    student_id IN (
      SELECT id
      FROM students
      WHERE church_id IN (
        SELECT church_id
        FROM users
        WHERE id = auth.uid()
          AND (
            permissions->>'canEditStudents' = 'true'
            OR role IN ('admin', 'church_admin')
          )
      )
    )
  );

-- Users with canEditStudents can delete guardians
CREATE POLICY "Users with canEditStudents can delete guardians"
  ON guardians
  FOR DELETE
  USING (
    student_id IN (
      SELECT id
      FROM students
      WHERE church_id IN (
        SELECT church_id
        FROM users
        WHERE id = auth.uid()
          AND (
            permissions->>'canEditStudents' = 'true'
            OR role IN ('admin', 'church_admin')
          )
      )
    )
  );

-- ============================================================================
-- 7. ATTENDANCE TABLE
-- ============================================================================

-- Enable RLS
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Users can view attendance for students they can see
CREATE POLICY "Users can view attendance for their students"
  ON attendance
  FOR SELECT
  USING (
    student_id IN (
      SELECT id
      FROM students
      WHERE church_id IN (
        SELECT church_id
        FROM users
        WHERE id = auth.uid()
      )
      AND (
        -- Admins can see all
        EXISTS (
          SELECT 1
          FROM users
          WHERE id = auth.uid()
            AND role IN ('admin', 'church_admin')
        )
        OR
        -- Teachers can only see their class students
        class_id IN (
          SELECT class_id
          FROM class_teachers
          WHERE teacher_id = auth.uid()
        )
      )
    )
  );

-- Users with canTakeAttendance can insert attendance
CREATE POLICY "Users with canTakeAttendance can insert attendance"
  ON attendance
  FOR INSERT
  WITH CHECK (
    student_id IN (
      SELECT id
      FROM students
      WHERE church_id IN (
        SELECT church_id
        FROM users
        WHERE id = auth.uid()
          AND (
            permissions->>'canTakeAttendance' = 'true'
            OR role IN ('admin', 'church_admin')
          )
      )
    )
  );

-- Users with canTakeAttendance can update attendance
CREATE POLICY "Users with canTakeAttendance can update attendance"
  ON attendance
  FOR UPDATE
  USING (
    student_id IN (
      SELECT id
      FROM students
      WHERE church_id IN (
        SELECT church_id
        FROM users
        WHERE id = auth.uid()
          AND (
            permissions->>'canTakeAttendance' = 'true'
            OR role IN ('admin', 'church_admin')
          )
      )
    )
  );

-- ============================================================================
-- 8. TESTS TABLE
-- ============================================================================

-- Enable RLS
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;

-- Users can view tests in their church
CREATE POLICY "Users can view tests in their church"
  ON tests
  FOR SELECT
  USING (
    church_id IN (
      SELECT church_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- Users with canManageTests can insert tests
CREATE POLICY "Users with canManageTests can insert tests"
  ON tests
  FOR INSERT
  WITH CHECK (
    church_id IN (
      SELECT church_id
      FROM users
      WHERE id = auth.uid()
        AND (
          permissions->>'canManageTests' = 'true'
          OR role IN ('admin', 'church_admin')
        )
    )
  );

-- Users with canManageTests can update tests
CREATE POLICY "Users with canManageTests can update tests"
  ON tests
  FOR UPDATE
  USING (
    church_id IN (
      SELECT church_id
      FROM users
      WHERE id = auth.uid()
        AND (
          permissions->>'canManageTests' = 'true'
          OR role IN ('admin', 'church_admin')
        )
    )
  );

-- Users with canManageTests can delete tests
CREATE POLICY "Users with canManageTests can delete tests"
  ON tests
  FOR DELETE
  USING (
    church_id IN (
      SELECT church_id
      FROM users
      WHERE id = auth.uid()
        AND (
          permissions->>'canManageTests' = 'true'
          OR role IN ('admin', 'church_admin')
        )
    )
  );

-- ============================================================================
-- 9. TEST_RESULTS TABLE
-- ============================================================================

-- Enable RLS
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;

-- Users can view test results for students they can see
CREATE POLICY "Users can view test results for their students"
  ON test_results
  FOR SELECT
  USING (
    student_id IN (
      SELECT id
      FROM students
      WHERE church_id IN (
        SELECT church_id
        FROM users
        WHERE id = auth.uid()
      )
    )
  );

-- Users with canManageTests can insert test results
CREATE POLICY "Users with canManageTests can insert test results"
  ON test_results
  FOR INSERT
  WITH CHECK (
    test_id IN (
      SELECT id
      FROM tests
      WHERE church_id IN (
        SELECT church_id
        FROM users
        WHERE id = auth.uid()
          AND (
            permissions->>'canManageTests' = 'true'
            OR role IN ('admin', 'church_admin')
          )
      )
    )
  );

-- Users with canManageTests can update test results
CREATE POLICY "Users with canManageTests can update test results"
  ON test_results
  FOR UPDATE
  USING (
    test_id IN (
      SELECT id
      FROM tests
      WHERE church_id IN (
        SELECT church_id
        FROM users
        WHERE id = auth.uid()
          AND (
            permissions->>'canManageTests' = 'true'
            OR role IN ('admin', 'church_admin')
          )
      )
    )
  );

-- Users with canManageTests can delete test results
CREATE POLICY "Users with canManageTests can delete test results"
  ON test_results
  FOR DELETE
  USING (
    test_id IN (
      SELECT id
      FROM tests
      WHERE church_id IN (
        SELECT church_id
        FROM users
        WHERE id = auth.uid()
          AND (
            permissions->>'canManageTests' = 'true'
            OR role IN ('admin', 'church_admin')
          )
      )
    )
  );

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify your RLS policies are set up correctly:

-- Check which tables have RLS enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = true;

-- View all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
