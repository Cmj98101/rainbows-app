import Link from "next/link";
import { redirect } from "next/navigation";
import { Student } from "@/types/student";
import StudentsTable from "./StudentsTable";
import { getSession, getCurrentChurchId, getCurrentUserId, hasRole } from "@/lib/auth-helpers";
import { getStudentsWithGuardians, getStudentsForTeacher } from "@/lib/supabase-helpers";

async function getStudents() {
  try {
    const session = await getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    const churchId = await getCurrentChurchId();
    const isTeacher = await hasRole('teacher');
    const isAdmin = await hasRole('admin') || await hasRole('church_admin');

    // For admins, use the API endpoint to get grouped data
    if (isAdmin) {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/students?groupByClass=true`, {
        headers: {
          'Cookie': `supabase-auth-token=${session.accessToken}`
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch grouped students');
      }

      return {
        grouped: await response.json(),
        isGrouped: true
      };
    }

    // For teachers, get flat list
    const userId = await getCurrentUserId();
    const students = await getStudentsForTeacher(userId, churchId);

    // Format for frontend compatibility
    return {
      students: students.map((student: any) => ({
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
        testResults: student.test_results || [],
      })),
      isGrouped: false
    };
  } catch (error) {
    console.error("Error fetching students:", error);
    throw error;
  }
}

export default async function StudentsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/auth/signin");
  }

  const data = await getStudents();
  const plainData = JSON.parse(JSON.stringify(data));
  return <StudentsTable data={plainData} />;
}
