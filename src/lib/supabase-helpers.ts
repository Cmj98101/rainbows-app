/**
 * Reusable Supabase Helper Functions (DRY)
 *
 * This file contains common database operations to avoid code duplication.
 */

import { supabaseAdmin } from './supabase';
import type { Student, Guardian, Attendance, Test, TestResult, User } from '@/types/supabase';

// ============================================================================
// CLASS OPERATIONS
// ============================================================================

/**
 * Get all classes for a church
 */
export async function getClasses(churchId: string) {
  const { data, error } = await supabaseAdmin
    .from('classes')
    .select(`
      *,
      teachers:class_teachers (
        user:users (
          id,
          name,
          email
        )
      )
    `)
    .eq('church_id', churchId)
    .order('name', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Get a single class by ID
 */
export async function getClassById(classId: string, churchId: string) {
  const { data, error } = await supabaseAdmin
    .from('classes')
    .select(`
      *,
      teachers:class_teachers (
        user:users (
          id,
          name,
          email
        )
      )
    `)
    .eq('id', classId)
    .eq('church_id', churchId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create a new class
 */
export async function createClass(
  churchId: string,
  classData: {
    name: string;
    age_group?: string;
    description?: string;
    schedule?: any;
  }
) {
  const { data, error } = await supabaseAdmin
    .from('classes')
    .insert({
      church_id: churchId,
      ...classData,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update a class
 */
export async function updateClass(
  classId: string,
  churchId: string,
  updates: Partial<{
    name: string;
    age_group: string;
    description: string;
    schedule: any;
  }>
) {
  const { data, error } = await supabaseAdmin
    .from('classes')
    .update(updates)
    .eq('id', classId)
    .eq('church_id', churchId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a class
 */
export async function deleteClass(classId: string, churchId: string) {
  const { error } = await supabaseAdmin
    .from('classes')
    .delete()
    .eq('id', classId)
    .eq('church_id', churchId);

  if (error) throw error;
}

/**
 * Assign teachers to a class
 */
export async function assignTeachersToClass(classId: string, teacherIds: string[]) {
  // First, remove all existing assignments for this class
  await supabaseAdmin
    .from('class_teachers')
    .delete()
    .eq('class_id', classId);

  // Then insert new assignments
  if (teacherIds.length > 0) {
    const assignments = teacherIds.map((teacherId) => ({
      class_id: classId,
      teacher_id: teacherId,
    }));

    const { error } = await supabaseAdmin
      .from('class_teachers')
      .insert(assignments);

    if (error) throw error;
  }
}

/**
 * Get classes for a specific teacher
 */
export async function getClassesForTeacher(teacherId: string) {
  const { data, error } = await supabaseAdmin
    .from('class_teachers')
    .select(`
      class:classes (
        *
      )
    `)
    .eq('teacher_id', teacherId);

  if (error) throw error;
  return data.map((item: any) => item.class);
}

// ============================================================================
// STUDENT OPERATIONS
// ============================================================================

/**
 * Get all students for a church with their guardians
 */
export async function getStudentsWithGuardians(churchId: string, classId?: string) {
  let query = supabaseAdmin
    .from('students')
    .select(`
      *,
      guardians (*),
      class:classes (
        id,
        name,
        age_group
      )
    `)
    .eq('church_id', churchId)
    .order('last_name', { ascending: true });

  if (classId) {
    query = query.eq('class_id', classId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

/**
 * Get students for a specific teacher (only their assigned classes)
 */
export async function getStudentsForTeacher(teacherId: string, churchId: string) {
  // First get the teacher's class IDs
  const classes = await getClassesForTeacher(teacherId);
  const classIds = classes.map((c: any) => c.id);

  if (classIds.length === 0) {
    return []; // Teacher has no classes assigned
  }

  // Get students in those classes
  const { data, error } = await supabaseAdmin
    .from('students')
    .select(`
      *,
      guardians (*),
      class:classes (
        id,
        name,
        age_group
      )
    `)
    .eq('church_id', churchId)
    .in('class_id', classIds)
    .order('last_name', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Get a single student by ID with all related data
 */
export async function getStudentById(studentId: string, churchId: string) {
  const { data, error } = await supabaseAdmin
    .from('students')
    .select(`
      *,
      guardians (*),
      class:classes (*),
      attendance (*),
      test_results (
        *,
        test:tests (*)
      )
    `)
    .eq('id', studentId)
    .eq('church_id', churchId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create a new student with guardians
 */
export async function createStudent(
  churchId: string,
  studentData: {
    class_id?: string;
    first_name: string;
    last_name: string;
    birthday?: string;
    gender?: string;
    email?: string;
    phone?: string;
    address?: any;
  },
  guardians?: Array<{
    name: string;
    relationship?: string;
    phone?: string;
    email?: string;
    address?: any;
    is_emergency_contact?: boolean;
  }>
) {
  // Insert student
  const { data: student, error: studentError } = await supabaseAdmin
    .from('students')
    .insert({
      church_id: churchId,
      ...studentData,
    })
    .select()
    .single();

  if (studentError) throw studentError;

  // Insert guardians if provided
  if (guardians && guardians.length > 0) {
    const guardianInserts = guardians.map((g) => ({
      student_id: student.id,
      ...g,
    }));

    const { error: guardianError } = await supabaseAdmin
      .from('guardians')
      .insert(guardianInserts);

    if (guardianError) throw guardianError;
  }

  // Return student with guardians
  return getStudentById(student.id, churchId);
}

/**
 * Update a student
 */
export async function updateStudent(
  studentId: string,
  churchId: string,
  updates: Partial<Student>
) {
  const { data, error } = await supabaseAdmin
    .from('students')
    .update(updates)
    .eq('id', studentId)
    .eq('church_id', churchId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a student (cascades to guardians, attendance, test results)
 */
export async function deleteStudent(studentId: string, churchId: string) {
  const { error } = await supabaseAdmin
    .from('students')
    .delete()
    .eq('id', studentId)
    .eq('church_id', churchId);

  if (error) throw error;
}

// ============================================================================
// ATTENDANCE OPERATIONS
// ============================================================================

/**
 * Get attendance for a specific date
 */
export async function getAttendanceByDate(churchId: string, date: string, classId?: string) {
  let query = supabaseAdmin
    .from('attendance')
    .select(`
      *,
      student:students!inner (
        id,
        first_name,
        last_name,
        church_id
      )
    `)
    .eq('student.church_id', churchId)
    .eq('date', date)
    .order('student.last_name', { ascending: true });

  if (classId) {
    query = query.eq('class_id', classId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

/**
 * Save attendance for multiple students
 */
export async function saveAttendance(
  churchId: string,
  classId: string,
  date: string,
  attendanceRecords: Array<{
    student_id: string;
    present: boolean;
  }>,
  recordedBy?: string
) {
  // First, delete existing attendance for this date and class
  await supabaseAdmin
    .from('attendance')
    .delete()
    .eq('date', date)
    .eq('class_id', classId);

  // Insert new attendance records
  const records = attendanceRecords.map((record) => ({
    student_id: record.student_id,
    class_id: classId,
    date,
    present: record.present,
    recorded_by: recordedBy,
  }));

  const { data, error } = await supabaseAdmin
    .from('attendance')
    .insert(records)
    .select();

  if (error) throw error;
  return data;
}

/**
 * Get attendance statistics for a date range
 */
export async function getAttendanceStats(
  churchId: string,
  startDate: string,
  endDate: string,
  classId?: string
) {
  let query = supabaseAdmin
    .from('attendance')
    .select(`
      *,
      student:students!inner (
        church_id,
        class_id
      )
    `)
    .eq('student.church_id', churchId)
    .gte('date', startDate)
    .lte('date', endDate);

  if (classId) {
    query = query.eq('student.class_id', classId);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Calculate stats
  const totalRecords = data.length;
  const presentCount = data.filter((r) => r.present).length;
  const rate = totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0;

  return {
    totalRecords,
    presentCount,
    absentCount: totalRecords - presentCount,
    attendanceRate: Math.round(rate * 10) / 10,
    records: data,
  };
}

// ============================================================================
// TEST OPERATIONS
// ============================================================================

/**
 * Get all tests for a church
 */
export async function getTests(churchId: string, classId?: string) {
  let query = supabaseAdmin
    .from('tests')
    .select(`
      *,
      class:classes (
        id,
        name
      ),
      test_results (
        id,
        status,
        student_id
      )
    `)
    .eq('church_id', churchId)
    .order('date', { ascending: false });

  if (classId) {
    query = query.eq('class_id', classId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

/**
 * Get tests for a specific teacher (only their assigned classes)
 */
export async function getTestsForTeacher(teacherId: string, churchId: string) {
  // First get the teacher's assigned class IDs
  const { data: classAssignments, error: classError } = await supabaseAdmin
    .from('class_teachers')
    .select('class_id')
    .eq('teacher_id', teacherId);

  if (classError) throw classError;

  if (!classAssignments || classAssignments.length === 0) {
    return []; // Teacher has no classes assigned
  }

  const classIds = classAssignments.map(ca => ca.class_id);

  // Get tests for those classes
  const { data, error } = await supabaseAdmin
    .from('tests')
    .select(`
      *,
      class:classes (
        id,
        name
      ),
      test_results (
        id,
        status,
        student_id
      )
    `)
    .eq('church_id', churchId)
    .in('class_id', classIds)
    .order('date', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Get a single test with all results
 */
export async function getTestById(testId: string, churchId: string) {
  const { data, error } = await supabaseAdmin
    .from('tests')
    .select(`
      *,
      class:classes (*),
      test_results (
        *,
        student:students (
          id,
          first_name,
          last_name
        )
      )
    `)
    .eq('id', testId)
    .eq('church_id', churchId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create a new test
 */
export async function createTest(
  churchId: string,
  testData: {
    name: string;
    date: string;
    class_id?: string;
    description?: string;
  },
  createdBy?: string
) {
  const { data, error } = await supabaseAdmin
    .from('tests')
    .insert({
      church_id: churchId,
      created_by: createdBy,
      ...testData,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Save test results for multiple students
 */
export async function saveTestResults(
  testId: string,
  results: Array<{
    student_id: string;
    status: 'passed' | 'failed' | 'absent';
    score?: number;
    notes?: string;
  }>
) {
  // Use upsert to insert or update
  const { data, error } = await supabaseAdmin
    .from('test_results')
    .upsert(
      results.map((r) => ({
        test_id: testId,
        ...r,
      })),
      {
        onConflict: 'test_id,student_id',
      }
    )
    .select();

  if (error) throw error;
  return data;
}

/**
 * Delete a test (cascades to test results)
 */
export async function deleteTest(testId: string, churchId: string) {
  const { error } = await supabaseAdmin
    .from('tests')
    .delete()
    .eq('id', testId)
    .eq('church_id', churchId);

  if (error) throw error;
}

// ============================================================================
// DASHBOARD OPERATIONS
// ============================================================================

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(churchId: string, classId?: string) {
  // Get total students
  let studentQuery = supabaseAdmin
    .from('students')
    .select('id', { count: 'exact' })
    .eq('church_id', churchId);

  if (classId) {
    studentQuery = studentQuery.eq('class_id', classId);
  }

  const { count: totalStudents } = await studentQuery;

  // Get today's attendance
  const today = new Date().toISOString().split('T')[0];
  const attendanceStats = await getAttendanceStats(churchId, today, today, classId);

  // Get recent tests with pass rates
  const tests = await getTests(churchId, classId);
  const recentTests = tests.slice(0, 5).map((test: any) => {
    const results = test.test_results || [];
    const passed = results.filter((r: any) => r.status === 'passed').length;
    const total = results.filter((r: any) => r.status !== 'absent').length;
    const passRate = total > 0 ? (passed / total) * 100 : 0;

    return {
      id: test.id,
      name: test.name,
      date: test.date,
      passRate: Math.round(passRate * 10) / 10,
      totalStudents: results.length,
    };
  });

  return {
    totalStudents: totalStudents || 0,
    attendanceToday: attendanceStats,
    recentTests,
  };
}

// ============================================================================
// USER/AUTH OPERATIONS
// ============================================================================

/**
 * Get user by ID
 */
export async function getUserById(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select(`
      *,
      church:churches (*)
    `)
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get user by email (case-insensitive)
 */
export async function getUserByEmail(email: string) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select(`
      *,
      church:churches (*)
    `)
    .ilike('email', email)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data;
}
