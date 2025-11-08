import { NextResponse } from "next/server";
import { getStudentById, updateStudent, deleteStudent } from "@/lib/supabase-helpers";
import { supabaseAdmin } from "@/lib/supabase";
import { getCurrentChurchId, requireAuth } from "@/lib/auth-helpers";
import { toSnakeCase, studentFromDb } from "@/lib/case-converters";

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone validation - accepts various formats (digits, spaces, hyphens, parentheses)
const PHONE_REGEX = /^[\d\s\-()]+$/;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const churchId = await getCurrentChurchId();

    const student = await getStudentById(id, churchId);
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Transform Supabase format to MongoDB format for frontend compatibility
    const formattedStudent = {
      _id: student.id,
      firstName: student.first_name,
      lastName: student.last_name,
      birthday: student.birthday,
      gender: student.gender,
      email: student.email,
      phone: student.phone,
      address: student.address,
      notes: student.notes,
      guardians: (student.guardians || []).map((g: any) => ({
        name: g.name,
        relationship: g.relationship,
        phone: g.phone,
        email: g.email,
        address: g.address,
        isEmergencyContact: g.is_emergency_contact,
      })),
      attendance: (student.attendance || []).map((a: any) => ({
        date: a.date,
        present: a.present,
      })),
      testResults: (student.test_results || []).map((tr: any) => ({
        testId: tr.test?.id || tr.test_id,
        testName: tr.test?.name || 'Unknown Test',
        date: tr.test?.date || tr.created_at,
        status: tr.status,
        score: tr.score,
      })),
    };

    return NextResponse.json(formattedStudent);
  } catch (error) {
    console.error("Error fetching student:", error);
    return NextResponse.json(
      { error: "Failed to fetch student" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const churchId = await getCurrentChurchId();
    const data = await request.json();

    // Handle guardians separately (they're in a separate table now)
    const { guardians, ...studentUpdates } = data;

    // Check for duplicate student name (if name is being changed)
    if (studentUpdates.firstName || studentUpdates.lastName) {
      // Get current student to check if name is actually changing
      const currentStudent = await getStudentById(id, churchId);

      const newFirstName = studentUpdates.firstName || currentStudent?.first_name;
      const newLastName = studentUpdates.lastName || currentStudent?.last_name;

      // Only check for duplicates if the name is actually changing
      if (newFirstName !== currentStudent?.first_name || newLastName !== currentStudent?.last_name) {
        const { data: existingStudent } = await supabaseAdmin
          .from('students')
          .select('id, first_name, last_name')
          .eq('church_id', churchId)
          .eq('first_name', newFirstName)
          .eq('last_name', newLastName)
          .neq('id', id)
          .single();

        if (existingStudent) {
          return NextResponse.json(
            { error: `A student named ${newFirstName} ${newLastName} already exists. Please use a different name.` },
            { status: 400 }
          );
        }
      }
    }

    // Validate student email format if provided
    if (studentUpdates.email && !EMAIL_REGEX.test(studentUpdates.email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate student phone format if provided
    if (studentUpdates.phone && !PHONE_REGEX.test(studentUpdates.phone)) {
      return NextResponse.json(
        { error: "Invalid phone format. Only digits, spaces, hyphens, and parentheses are allowed." },
        { status: 400 }
      );
    }

    // Convert camelCase to snake_case for database
    const dbStudentUpdates = toSnakeCase(studentUpdates);

    // Update student basic info
    const student = await updateStudent(id, churchId, dbStudentUpdates);

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Update guardians if provided
    if (guardians) {
      // Validate guardian formats
      for (const guardian of guardians) {
        if (guardian.name && guardian.relationship && guardian.phone) {
          // Validate guardian phone format
          if (!PHONE_REGEX.test(guardian.phone)) {
            return NextResponse.json(
              { error: `Invalid phone format for guardian ${guardian.name}. Only digits, spaces, hyphens, and parentheses are allowed.` },
              { status: 400 }
            );
          }
          // Validate guardian email format if provided
          if (guardian.email && !EMAIL_REGEX.test(guardian.email)) {
            return NextResponse.json(
              { error: `Invalid email format for guardian ${guardian.name}` },
              { status: 400 }
            );
          }
        }
      }

      // Validate at least one guardian
      const validGuardians = guardians
        .filter((g: any) => g.name && g.relationship && g.phone)
        .map((g: any) => ({
          student_id: id,
          ...toSnakeCase(g),
        }));

      if (validGuardians.length === 0) {
        return NextResponse.json(
          { error: "At least one guardian with name, relationship, and phone is required" },
          { status: 400 }
        );
      }

      // Delete existing guardians
      await supabaseAdmin
        .from('guardians')
        .delete()
        .eq('student_id', id);

      // Insert new guardians
      const guardiansData: any = validGuardians;
      await supabaseAdmin
        .from('guardians')
        .insert(guardiansData);
    }

    // Return updated student with guardians (formatted)
    const updatedStudent = await getStudentById(id, churchId);
    console.log("Updated student:", updatedStudent.id);

    // Transform to MongoDB format
    const formattedStudent = {
      _id: updatedStudent.id,
      firstName: updatedStudent.first_name,
      lastName: updatedStudent.last_name,
      birthday: updatedStudent.birthday,
      gender: updatedStudent.gender,
      email: updatedStudent.email,
      phone: updatedStudent.phone,
      address: updatedStudent.address,
      notes: updatedStudent.notes,
      guardians: (updatedStudent.guardians || []).map((g: any) => ({
        name: g.name,
        relationship: g.relationship,
        phone: g.phone,
        email: g.email,
        address: g.address,
        isEmergencyContact: g.is_emergency_contact,
      })),
    };

    return NextResponse.json(formattedStudent);
  } catch (error) {
    console.error("Error updating student:", error);
    return NextResponse.json(
      { error: "Failed to update student" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const churchId = await getCurrentChurchId();

    // Get counts of related data that will be deleted
    const [attendanceCount, testResultCount] = await Promise.all([
      supabaseAdmin
        .from('attendance')
        .select('id', { count: 'exact' })
        .eq('student_id', id)
        .then(({ count }) => count || 0),
      supabaseAdmin
        .from('test_results')
        .select('id', { count: 'exact' })
        .eq('student_id', id)
        .then(({ count }) => count || 0),
    ]);

    await deleteStudent(id, churchId);

    const cascadeInfo = [];
    if (attendanceCount > 0) cascadeInfo.push(`${attendanceCount} attendance record${attendanceCount !== 1 ? 's' : ''}`);
    if (testResultCount > 0) cascadeInfo.push(`${testResultCount} test result${testResultCount !== 1 ? 's' : ''}`);

    const message = cascadeInfo.length > 0
      ? `Student deleted successfully along with ${cascadeInfo.join(' and ')}`
      : "Student deleted successfully";

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Error deleting student:", error);
    return NextResponse.json(
      { error: "Failed to delete student" },
      { status: 500 }
    );
  }
}
