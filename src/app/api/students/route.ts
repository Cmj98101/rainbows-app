import { NextResponse } from "next/server";
import { getStudentsWithGuardians, createStudent, getStudentsForTeacher } from "@/lib/supabase-helpers";
import { getCurrentChurchId, requireAuth, hasRole, getCurrentUserId } from "@/lib/auth-helpers";
import { toSnakeCase, studentFromDb } from "@/lib/case-converters";
import { supabaseAdmin } from "@/lib/supabase";

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone validation - accepts various formats (digits, spaces, hyphens, parentheses)
const PHONE_REGEX = /^[\d\s\-()]+$/;

export async function GET(request: Request) {
  try {
    await requireAuth();
    console.log("Fetching students from Supabase...");
    const churchId = await getCurrentChurchId();

    // Check query params
    const { searchParams } = new URL(request.url);
    const groupByClass = searchParams.get("groupByClass") === "true";
    const classIdFilter = searchParams.get("classId");

    // Check if user is a teacher (non-admin)
    const isTeacher = await hasRole('teacher');
    const isAdmin = await hasRole('admin') || await hasRole('church_admin');

    let students;
    if (isTeacher && !isAdmin) {
      // Teachers can only see students in their assigned classes
      const userId = await getCurrentUserId();
      students = await getStudentsForTeacher(userId, churchId);
      console.log(`Found ${students.length} students for teacher's classes`);
    } else {
      // Admins can see all students
      students = await getStudentsWithGuardians(churchId);
      console.log(`Found ${students.length} students`);
    }

    // Filter by classId if specified
    if (classIdFilter) {
      students = students.filter((s: any) => s.class_id === classIdFilter);
      console.log(`Filtered to ${students.length} students for class ${classIdFilter}`);
    }

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
      classId: student.class_id,
      className: student.class?.name,
      guardians: student.guardians?.map((g: any) => ({
        name: g.name,
        relationship: g.relationship,
        phone: g.phone,
        email: g.email,
        address: g.address,
        isEmergencyContact: g.is_emergency_contact,
      })) || [],
      attendance: student.attendance || [],
      testResults: student.test_results?.map((tr: any) => ({
        testId: tr.test_id,
        status: tr.status,
      })) || [],
    }));

    // If admin wants grouped data
    if (groupByClass && isAdmin) {
      // Group students by class
      const groupedByClass: Record<string, any> = {};

      formattedStudents.forEach((student) => {
        const classKey = student.classId || 'unassigned';
        const className = student.className || 'Unassigned Students';

        if (!groupedByClass[classKey]) {
          groupedByClass[classKey] = {
            classId: student.classId,
            className: className,
            students: [],
          };
        }

        groupedByClass[classKey].students.push(student);
      });

      // Convert to array and sort by class name
      const groupedArray = Object.values(groupedByClass).sort((a, b) =>
        a.className.localeCompare(b.className)
      );

      return NextResponse.json(groupedArray);
    }

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
    await requireAuth();
    console.log("Creating new student in Supabase...");
    const churchId = await getCurrentChurchId();
    const body = await request.json();

    const { guardians, birthday, ...studentData } = body;

    // Check for duplicate student name
    const { data: existingStudent } = await supabaseAdmin
      .from('students')
      .select('id, first_name, last_name')
      .eq('church_id', churchId)
      .eq('first_name', studentData.firstName)
      .eq('last_name', studentData.lastName)
      .single();

    if (existingStudent) {
      return NextResponse.json(
        { error: `A student named ${studentData.firstName} ${studentData.lastName} already exists. Please use a different name or check if this is a duplicate.` },
        { status: 400 }
      );
    }

    // Validate birthday if provided
    if (birthday) {
      const birthDate = new Date(birthday);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (birthDate > today) {
        return NextResponse.json(
          { error: "Birthday cannot be in the future" },
          { status: 400 }
        );
      }

      // Validate reasonable age (not more than 150 years old)
      const maxAge = new Date(today);
      maxAge.setFullYear(maxAge.getFullYear() - 150);

      if (birthDate < maxAge) {
        return NextResponse.json(
          { error: "Invalid birthday - age cannot exceed 150 years" },
          { status: 400 }
        );
      }
    }

    // Validate student email format if provided
    if (studentData.email && !EMAIL_REGEX.test(studentData.email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate student phone format if provided
    if (studentData.phone && !PHONE_REGEX.test(studentData.phone)) {
      return NextResponse.json(
        { error: "Invalid phone format. Only digits, spaces, hyphens, and parentheses are allowed." },
        { status: 400 }
      );
    }

    // Validate at least one guardian is provided
    if (!guardians || !Array.isArray(guardians) || guardians.length === 0) {
      return NextResponse.json(
        { error: "At least one guardian is required" },
        { status: 400 }
      );
    }

    // Validate guardian has required fields and valid formats
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

    // Validate guardian has required fields
    const validGuardians = guardians.filter(
      (g: any) => g.name && g.relationship && g.phone
    );

    if (validGuardians.length === 0) {
      return NextResponse.json(
        { error: "At least one guardian with name, relationship, and phone is required" },
        { status: 400 }
      );
    }

    // Convert camelCase to snake_case
    const dbStudentData = toSnakeCase({ ...studentData, birthday });

    const student = await createStudent(
      churchId,
      dbStudentData,
      toSnakeCase(validGuardians)
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
