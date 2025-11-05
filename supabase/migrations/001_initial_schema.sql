-- Rainbows App - Initial Schema Migration
-- Multi-tenant church management system with hierarchical permissions

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CHURCHES TABLE (Tenant)
-- ============================================================================
CREATE TABLE churches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address JSONB DEFAULT '{}',
  phone TEXT,
  email TEXT,
  subscription TEXT DEFAULT 'free' CHECK (subscription IN ('free', 'pro', 'team', 'enterprise')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_churches_subscription ON churches(subscription);

-- ============================================================================
-- USERS TABLE (Church Admin, Admin, Teachers)
-- ============================================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('church_admin', 'admin', 'teacher')),
  permissions JSONB DEFAULT '{
    "canManageUsers": false,
    "canManageClasses": false,
    "canEditStudents": true,
    "canTakeAttendance": true,
    "canManageTests": true,
    "canViewReports": false
  }',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_church ON users(church_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================================
-- CLASSES TABLE (Age groups)
-- ============================================================================
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age_group TEXT,
  description TEXT,
  schedule JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_classes_church ON classes(church_id);
CREATE INDEX idx_classes_age_group ON classes(age_group);

-- ============================================================================
-- CLASS_TEACHERS TABLE (Many-to-Many relationship)
-- ============================================================================
CREATE TABLE class_teachers (
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (class_id, teacher_id)
);

CREATE INDEX idx_class_teachers_class ON class_teachers(class_id);
CREATE INDEX idx_class_teachers_teacher ON class_teachers(teacher_id);

-- ============================================================================
-- STUDENTS TABLE
-- ============================================================================
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  birthday DATE,
  gender TEXT,
  email TEXT,
  phone TEXT,
  address JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_students_church ON students(church_id);
CREATE INDEX idx_students_class ON students(class_id);
CREATE INDEX idx_students_name ON students(last_name, first_name);

-- ============================================================================
-- GUARDIANS TABLE
-- ============================================================================
CREATE TABLE guardians (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT,
  phone TEXT,
  email TEXT,
  address JSONB DEFAULT '{}',
  is_emergency_contact BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_guardians_student ON guardians(student_id);
CREATE INDEX idx_guardians_emergency ON guardians(is_emergency_contact);

-- ============================================================================
-- ATTENDANCE TABLE
-- ============================================================================
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  present BOOLEAN NOT NULL,
  notes TEXT,
  recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, date, class_id)
);

CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_attendance_class ON attendance(class_id);
CREATE INDEX idx_attendance_date ON attendance(date DESC);
CREATE INDEX idx_attendance_student_date ON attendance(student_id, date DESC);

-- ============================================================================
-- TESTS TABLE
-- ============================================================================
CREATE TABLE tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tests_church ON tests(church_id);
CREATE INDEX idx_tests_class ON tests(class_id);
CREATE INDEX idx_tests_date ON tests(date DESC);

-- ============================================================================
-- TEST_RESULTS TABLE
-- ============================================================================
CREATE TABLE test_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('passed', 'failed', 'absent')),
  score NUMERIC(5, 2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(test_id, student_id)
);

CREATE INDEX idx_test_results_test ON test_results(test_id);
CREATE INDEX idx_test_results_student ON test_results(student_id);
CREATE INDEX idx_test_results_status ON test_results(status);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables with updated_at column
CREATE TRIGGER update_churches_updated_at BEFORE UPDATE ON churches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guardians_updated_at BEFORE UPDATE ON guardians
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tests_updated_at BEFORE UPDATE ON tests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_test_results_updated_at BEFORE UPDATE ON test_results
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
