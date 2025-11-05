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
    return NextResponse.json(student);
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

    // Return updated student with guardians
    const updatedStudent = await getStudentById(id, churchId);
    console.log("Updated student:", updatedStudent.id);
    return NextResponse.json(updatedStudent);
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
