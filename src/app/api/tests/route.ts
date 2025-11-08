import { NextResponse } from "next/server";
import { getTests, getTestsForTeacher, createTest } from "@/lib/supabase-helpers";
import { requireAuth, getCurrentChurchId, getCurrentUserId, hasRole, hasPermission } from "@/lib/auth-helpers";
import { toSnakeCase } from "@/lib/case-converters";

export async function GET(request: Request) {
  try {
    await requireAuth();
    const churchId = await getCurrentChurchId();

    // Check query params
    const { searchParams } = new URL(request.url);
    const groupByClass = searchParams.get("groupByClass") === "true";

    // Check if user is a teacher (non-admin)
    const isTeacher = await hasRole('teacher');
    const isAdmin = await hasRole('admin') || await hasRole('church_admin');

    let tests;
    if (isTeacher && !isAdmin) {
      // Teachers can only see tests for their assigned classes
      const userId = await getCurrentUserId();
      tests = await getTestsForTeacher(userId, churchId);
    } else {
      // Admins can see all tests
      tests = await getTests(churchId);
    }

    // Transform Supabase format to MongoDB format for frontend compatibility
    const formattedTests = tests.map((test: any) => {
      const results = test.test_results || [];
      const passed = results.filter((r: any) => r.status === 'passed').length;
      const total = results.filter((r: any) => r.status !== 'absent').length;
      const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

      return {
        _id: test.id,
        name: test.name,
        date: test.date,
        description: test.description,
        classId: test.class_id,
        className: test.class?.name,
        passRate,
        totalStudents: results.length,
      };
    });

    // If admin wants grouped data
    if (groupByClass && isAdmin) {
      // Group tests by class
      const groupedByClass: Record<string, any> = {};

      formattedTests.forEach((test) => {
        const classKey = test.classId || 'unassigned';
        const className = test.className || 'Unassigned Tests';

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

      return NextResponse.json(groupedArray);
    }

    return NextResponse.json(formattedTests);
  } catch (error) {
    console.error("Error fetching tests:", error);
    return NextResponse.json(
      { error: "Failed to fetch tests" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAuth();

    // Check permission
    const canManageTests = await hasPermission('canManageTests');
    if (!canManageTests) {
      return NextResponse.json(
        { error: 'Insufficient permissions to create tests' },
        { status: 403 }
      );
    }

    const churchId = await getCurrentChurchId();
    const userId = await getCurrentUserId();
    const body = await request.json();

    const { classId, date, ...testData } = body;

    // Enforce class_id requirement
    if (!classId) {
      return NextResponse.json(
        { error: 'class_id is required - all tests must be associated with a class' },
        { status: 400 }
      );
    }

    // Validate date
    if (!date) {
      return NextResponse.json(
        { error: 'Test date is required' },
        { status: 400 }
      );
    }

    const testDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Allow tests from up to 1 year in the past
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    // Allow tests up to 1 year in the future
    const oneYearFromNow = new Date(today);
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    if (testDate < oneYearAgo) {
      return NextResponse.json(
        { error: 'Test date cannot be more than 1 year in the past' },
        { status: 400 }
      );
    }

    if (testDate > oneYearFromNow) {
      return NextResponse.json(
        { error: 'Test date cannot be more than 1 year in the future' },
        { status: 400 }
      );
    }

    // Convert camelCase to snake_case and add required fields
    const dbTestData = {
      ...toSnakeCase(testData),
      date,
      class_id: classId,
      created_by: userId,
    };

    const test = await createTest(churchId, dbTestData);

    return NextResponse.json(test, { status: 201 });
  } catch (error) {
    console.error("Error creating test:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add test" },
      { status: 500 }
    );
  }
}
