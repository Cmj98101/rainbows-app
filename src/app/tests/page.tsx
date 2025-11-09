import { redirect } from "next/navigation";
import { getSession, getCurrentChurchId, getCurrentUserId, hasRole } from "@/lib/auth-helpers";
import { getTestsForTeacher, getTests as getAllTests } from "@/lib/supabase-helpers";
import TestsTable from "./TestsTable";

async function getTestsData() {
  try {
    const session = await getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    const churchId = await getCurrentChurchId();
    const isTeacher = await hasRole('teacher');
    const isAdmin = await hasRole('admin') || await hasRole('church_admin');

    // For admins, get all tests and group by class
    if (isAdmin) {
      const allTests = await getAllTests(churchId);

      // Format tests
      const formattedTests = allTests.map((test: any) => {
        const results = test.test_results || [];
        const passed = results.filter((r: any) => r.status === 'passed').length;
        const total = results.filter((r: any) => r.status !== 'absent').length;
        const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

        return {
          _id: test.id,
          name: test.name,
          date: test.date,
          description: test.description,
          passRate,
          totalStudents: results.length,
          className: test.class?.name || 'Unassigned Tests',
          classId: test.class_id,
        };
      });

      // Group tests by class
      const groupedByClass: Record<string, any> = {};

      formattedTests.forEach((test) => {
        const classKey = test.classId || 'unassigned';
        const className = test.className;

        if (!groupedByClass[classKey]) {
          groupedByClass[classKey] = {
            classId: test.classId,
            className: className,
            tests: [],
          };
        }

        groupedByClass[classKey].tests.push(test);
      });

      // Convert to array and sort by class name
      const groupedArray = Object.values(groupedByClass).sort((a, b) =>
        a.className.localeCompare(b.className)
      );

      return {
        grouped: groupedArray,
        isGrouped: true
      };
    }

    // For teachers, get flat list
    const userId = await getCurrentUserId();
    const tests = await getTestsForTeacher(userId, churchId);

    // Format for frontend compatibility
    return {
      tests: tests.map((test: any) => {
        const results = test.test_results || [];
        const passed = results.filter((r: any) => r.status === 'passed').length;
        const total = results.filter((r: any) => r.status !== 'absent').length;
        const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

        return {
          _id: test.id,
          name: test.name,
          date: test.date,
          description: test.description,
          passRate,
          totalStudents: results.length,
          className: test.class?.name,
        };
      }),
      isGrouped: false
    };
  } catch (error) {
    console.error("Error fetching tests:", error);
    throw error;
  }
}

export default async function TestsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/auth/signin");
  }

  const data = await getTestsData();
  const plainData = JSON.parse(JSON.stringify(data));
  return <TestsTable data={plainData} />;
}
