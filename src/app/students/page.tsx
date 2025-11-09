import Link from "next/link";
import { redirect } from "next/navigation";
import { Student } from "@/types/student";
import StudentsTable from "./StudentsTable";
import { getSession, getCurrentChurchId, getCurrentUserId, hasRole } from "@/lib/auth-helpers";
import { getStudentsWithGuardians, getStudentsForTeacher, getClasses } from "@/lib/supabase-helpers";

async function getStudents() {
  try {
    const session = await getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    const churchId = await getCurrentChurchId();
    const isTeacher = await hasRole('teacher');
    const isAdmin = await hasRole('admin') || await hasRole('church_admin');

    let students;

    // Get students based on role
    if (isTeacher && !isAdmin) {
      // Teachers can only see students in their assigned classes
      const userId = await getCurrentUserId();
      students = await getStudentsForTeacher(userId, churchId);
    } else {
      // Admins can see all students
      students = await getStudentsWithGuardians(churchId);
    }

    // Format for frontend compatibility
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
      testResults: student.test_results || [],
    }));

    // If admin, group students by class
    if (isAdmin) {
      // First, fetch all classes to ensure we show every class even if empty
      const allClasses = await getClasses(churchId);

      const groupedByClass: Record<string, any> = {};

      // Initialize with all existing classes (with 0 students)
      allClasses.forEach((classItem: any) => {
        groupedByClass[classItem.id] = {
          classId: classItem.id,
          className: classItem.name,
          students: [],
        };
      });

      // Add unassigned students group
      groupedByClass['unassigned'] = {
        classId: null,
        className: 'Unassigned Students',
        students: [],
      };

      // Now add students to their respective classes
      formattedStudents.forEach((student) => {
        const classKey = student.classId || 'unassigned';

        if (groupedByClass[classKey]) {
          groupedByClass[classKey].students.push(student);
        } else {
          // If class doesn't exist anymore (shouldn't happen), add to unassigned
          groupedByClass['unassigned'].students.push(student);
        }
      });

      // Convert to array and sort - unassigned students first, then alphabetically
      const groupedArray = Object.values(groupedByClass).sort((a, b) => {
        // Always put unassigned students at the top
        if (a.classId === null && b.classId !== null) return -1;
        if (a.classId !== null && b.classId === null) return 1;
        // Otherwise sort alphabetically by class name
        return a.className.localeCompare(b.className);
      });

      return {
        grouped: groupedArray,
        isGrouped: true
      };
    }

    // For teachers, return flat list
    return {
      students: formattedStudents,
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
