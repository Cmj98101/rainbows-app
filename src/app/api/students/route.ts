import { NextResponse } from "next/server";
import { getStudentsWithGuardians, createStudent } from "@/lib/supabase-helpers";
import { getTempChurchId, getTempClassId } from "@/lib/temp-auth";

export async function GET() {
  try {
    console.log("Fetching students from Supabase...");
    const churchId = await getTempChurchId();

    const students = await getStudentsWithGuardians(churchId);
    console.log(`Found ${students.length} students`);

    // Format students to match MongoDB format for frontend compatibility
    const formattedStudents = students.map((student: any) => ({
      _id: student.id,
      firstName: student.first_name,
      lastName: student.last_name,
      birthday: student.birthday,
      gender: student.gender,
      email: student.email,
      phone: student.phone,
      address: student.address,
      guardians: student.guardians?.map((g: any) => ({
        name: g.name,
        relationship: g.relationship,
        phone: g.phone,
        email: g.email,
        address: g.address,
        isEmergencyContact: g.is_emergency_contact,
      })) || [],
      attendance: student.attendance || [],
      testResults: student.test_results || [],
    }));

    return NextResponse.json(formattedStudents);
  } catch (error) {
    console.error("Error in GET /api/students:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log("Creating new student in Supabase...");
    const churchId = await getTempChurchId();
    const classId = await getTempClassId();
    const body = await request.json();

    const { guardians, ...studentData } = body;

    const student = await createStudent(
      churchId,
      {
        class_id: classId,
        ...studentData,
      },
      guardians
    );

    console.log("Student created:", student.id);
    return NextResponse.json(student, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/students:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create student",
      },
      { status: 500 }
    );
  }
}
