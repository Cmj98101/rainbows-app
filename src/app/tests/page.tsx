import { redirect } from "next/navigation";
import { getSession, getCurrentChurchId, getCurrentUserId, hasRole } from "@/lib/auth-helpers";
import { getTestsForTeacher } from "@/lib/supabase-helpers";
import TestsTable from "./TestsTable";

async function getTests() {
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/tests?groupByClass=true`, {
        headers: {
          'Cookie': `supabase-auth-token=${session.accessToken}`
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch grouped tests');
      }

      return {
        grouped: await response.json(),
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

  const data = await getTests();
  const plainData = JSON.parse(JSON.stringify(data));
  return <TestsTable data={plainData} />;
}
