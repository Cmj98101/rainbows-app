import { NextResponse } from "next/server";
import { getStudentById, updateStudent, deleteStudent } from "@/lib/supabase-helpers";
import { supabaseAdmin } from "@/lib/supabase";
import { getTempChurchId } from "@/lib/temp-auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const churchId = await getTempChurchId();

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
    const { id } = await params;
    const churchId = await getTempChurchId();
    const data = await request.json();

    // Handle guardians separately (they're in a separate table now)
    const { guardians, ...studentUpdates } = data;

    // Update student basic info
    const student = await updateStudent(id, churchId, studentUpdates);

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Update guardians if provided
    if (guardians) {
      // Delete existing guardians
      await supabaseAdmin
        .from('guardians')
        .delete()
        .eq('student_id', id);

      // Insert new guardians
      if (guardians.length > 0) {
        const validGuardians = guardians
          .filter((g: any) => g.name && g.relationship && g.phone)
          .map((g: any) => ({
            student_id: id,
            name: g.name.trim(),
            relationship: g.relationship.trim(),
            phone: g.phone.trim(),
            email: g.email?.trim() || null,
            address: g.address || {},
            is_emergency_contact: Boolean(g.isEmergencyContact || g.is_emergency_contact),
          }));

        if (validGuardians.length > 0) {
          await supabaseAdmin
            .from('guardians')
            .insert(validGuardians);
        }
      }
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
    const { id } = await params;
    const churchId = await getTempChurchId();

    await deleteStudent(id, churchId);
    return NextResponse.json({ message: "Student deleted successfully" });
  } catch (error) {
    console.error("Error deleting student:", error);
    return NextResponse.json(
      { error: "Failed to delete student" },
      { status: 500 }
    );
  }
}
