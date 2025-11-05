-- Rainbows App - Row Level Security (RLS) Policies
-- Ensures multi-tenant data isolation at the database level

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================
ALTER TABLE churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get the church_id for the authenticated user
CREATE OR REPLACE FUNCTION public.user_church_id()
RETURNS UUID AS $$
  SELECT church_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Check if user is church admin
CREATE OR REPLACE FUNCTION public.is_church_admin()
RETURNS BOOLEAN AS $$
  SELECT role = 'church_admin' FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Check if user is admin or church admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT role IN ('church_admin', 'admin') FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Check if user is teacher for a specific class
CREATE OR REPLACE FUNCTION public.is_teacher_for_class(class_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.class_teachers
    WHERE teacher_id = auth.uid() AND class_id = class_uuid
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================================
-- CHURCHES TABLE POLICIES
-- ============================================================================

-- Users can view their own church
CREATE POLICY "Users can view own church"
  ON churches FOR SELECT
  USING (id = public.user_church_id());

-- Only church admins can update their church
CREATE POLICY "Church admins can update own church"
  ON churches FOR UPDATE
  USING (id = public.user_church_id() AND public.is_church_admin())
  WITH CHECK (id = public.user_church_id() AND public.is_church_admin());

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

-- Users can view users in their church
CREATE POLICY "Users can view users in own church"
  ON users FOR SELECT
  USING (church_id = public.user_church_id());

-- Admins can insert users in their church
CREATE POLICY "Admins can insert users in own church"
  ON users FOR INSERT
  WITH CHECK (church_id = public.user_church_id() AND public.is_admin());

-- Admins can update users in their church
CREATE POLICY "Admins can update users in own church"
  ON users FOR UPDATE
  USING (church_id = public.user_church_id() AND public.is_admin())
  WITH CHECK (church_id = public.user_church_id() AND public.is_admin());

-- Admins can delete users in their church (except themselves)
CREATE POLICY "Admins can delete users in own church"
  ON users FOR DELETE
  USING (church_id = public.user_church_id() AND public.is_admin() AND id != auth.uid());

-- ============================================================================
-- CLASSES TABLE POLICIES
-- ============================================================================

-- Users can view classes in their church
CREATE POLICY "Users can view classes in own church"
  ON classes FOR SELECT
  USING (church_id = public.user_church_id());

-- Admins can manage classes in their church
CREATE POLICY "Admins can insert classes in own church"
  ON classes FOR INSERT
  WITH CHECK (church_id = public.user_church_id() AND public.is_admin());

CREATE POLICY "Admins can update classes in own church"
  ON classes FOR UPDATE
  USING (church_id = public.user_church_id() AND public.is_admin())
  WITH CHECK (church_id = public.user_church_id() AND public.is_admin());

CREATE POLICY "Admins can delete classes in own church"
  ON classes FOR DELETE
  USING (church_id = public.user_church_id() AND public.is_admin());

-- ============================================================================
-- CLASS_TEACHERS TABLE POLICIES
-- ============================================================================

-- Users can view teacher assignments in their church
CREATE POLICY "Users can view class teachers in own church"
  ON class_teachers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM classes
      WHERE classes.id = class_teachers.class_id
      AND classes.church_id = public.user_church_id()
    )
  );

-- Admins can manage teacher assignments
CREATE POLICY "Admins can manage class teachers"
  ON class_teachers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM classes
      WHERE classes.id = class_teachers.class_id
      AND classes.church_id = public.user_church_id()
    ) AND public.is_admin()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM classes
      WHERE classes.id = class_teachers.class_id
      AND classes.church_id = public.user_church_id()
    ) AND public.is_admin()
  );

-- ============================================================================
-- STUDENTS TABLE POLICIES
-- ============================================================================

-- Users can view students in their church
CREATE POLICY "Users can view students in own church"
  ON students FOR SELECT
  USING (church_id = public.user_church_id());

-- Users can insert students in their church
CREATE POLICY "Users can insert students in own church"
  ON students FOR INSERT
  WITH CHECK (church_id = public.user_church_id());

-- Users can update students in their church (teachers only their assigned classes)
CREATE POLICY "Users can update students in own church"
  ON students FOR UPDATE
  USING (
    church_id = public.user_church_id() AND (
      public.is_admin() OR
      public.is_teacher_for_class(class_id)
    )
  )
  WITH CHECK (
    church_id = public.user_church_id() AND (
      public.is_admin() OR
      public.is_teacher_for_class(class_id)
    )
  );

-- Admins can delete students
CREATE POLICY "Admins can delete students"
  ON students FOR DELETE
  USING (church_id = public.user_church_id() AND public.is_admin());

-- ============================================================================
-- GUARDIANS TABLE POLICIES
-- ============================================================================

-- Users can view guardians for students in their church
CREATE POLICY "Users can view guardians in own church"
  ON guardians FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = guardians.student_id
      AND students.church_id = public.user_church_id()
    )
  );

-- Users can manage guardians for students in their church
CREATE POLICY "Users can manage guardians in own church"
  ON guardians FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = guardians.student_id
      AND students.church_id = public.user_church_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = guardians.student_id
      AND students.church_id = public.user_church_id()
    )
  );

-- ============================================================================
-- ATTENDANCE TABLE POLICIES
-- ============================================================================

-- Users can view attendance in their church
CREATE POLICY "Users can view attendance in own church"
  ON attendance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = attendance.student_id
      AND students.church_id = public.user_church_id()
    )
  );

-- Users can insert attendance (teachers only for their classes)
CREATE POLICY "Users can insert attendance"
  ON attendance FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = attendance.student_id
      AND students.church_id = public.user_church_id()
    ) AND (
      public.is_admin() OR
      public.is_teacher_for_class(attendance.class_id)
    )
  );

-- Users can update attendance they recorded
CREATE POLICY "Users can update attendance"
  ON attendance FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = attendance.student_id
      AND students.church_id = public.user_church_id()
    ) AND (
      public.is_admin() OR
      recorded_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = attendance.student_id
      AND students.church_id = public.user_church_id()
    ) AND (
      public.is_admin() OR
      recorded_by = auth.uid()
    )
  );

-- Admins can delete attendance
CREATE POLICY "Admins can delete attendance"
  ON attendance FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = attendance.student_id
      AND students.church_id = public.user_church_id()
    ) AND public.is_admin()
  );

-- ============================================================================
-- TESTS TABLE POLICIES
-- ============================================================================

-- Users can view tests in their church
CREATE POLICY "Users can view tests in own church"
  ON tests FOR SELECT
  USING (church_id = public.user_church_id());

-- Users can create tests in their church
CREATE POLICY "Users can insert tests in own church"
  ON tests FOR INSERT
  WITH CHECK (church_id = public.user_church_id());

-- Users can update tests they created, admins can update all
CREATE POLICY "Users can update tests"
  ON tests FOR UPDATE
  USING (
    church_id = public.user_church_id() AND (
      public.is_admin() OR
      created_by = auth.uid()
    )
  )
  WITH CHECK (
    church_id = public.user_church_id() AND (
      public.is_admin() OR
      created_by = auth.uid()
    )
  );

-- Admins can delete tests
CREATE POLICY "Admins can delete tests"
  ON tests FOR DELETE
  USING (church_id = public.user_church_id() AND public.is_admin());

-- ============================================================================
-- TEST_RESULTS TABLE POLICIES
-- ============================================================================

-- Users can view test results in their church
CREATE POLICY "Users can view test results in own church"
  ON test_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = test_results.student_id
      AND students.church_id = public.user_church_id()
    )
  );

-- Users can manage test results in their church
CREATE POLICY "Users can manage test results in own church"
  ON test_results FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = test_results.student_id
      AND students.church_id = public.user_church_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = test_results.student_id
      AND students.church_id = public.user_church_id()
    )
  );
