import { NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/supabase-helpers";
import { getCurrentChurchId, requireAuth, hasRole, getCurrentUserId } from "@/lib/auth-helpers";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    await requireAuth();
    console.log("Fetching dashboard data from Supabase...");
    const churchId = await getCurrentChurchId();
    const isTeacher = await hasRole('teacher');
    const isAdmin = await hasRole('admin') || await hasRole('church_admin');

    let response;

    // For teachers (non-admin), get stats only for their assigned classes
    if (isTeacher && !isAdmin) {
      const userId = await getCurrentUserId();

      // Get teacher's assigned class IDs
      const { data: classAssignments } = await supabaseAdmin
        .from('class_teachers')
        .select('class_id')
        .eq('teacher_id', userId);

      if (!classAssignments || classAssignments.length === 0) {
        // Teacher has no classes assigned
        return NextResponse.json({
          totalStudents: 0,
          todayAttendanceRate: 0,
          testPassRate: 0,
          recentTests: [],
          recentActivity: [],
        });
      }

      const classIds = classAssignments.map(ca => ca.class_id);

      // Get student count for teacher's classes
      const { count: totalStudents } = await supabaseAdmin
        .from('students')
        .select('id', { count: 'exact' })
        .eq('church_id', churchId)
        .in('class_id', classIds);

      // Get today's attendance for teacher's classes
      const today = new Date().toISOString().split('T')[0];
      const { data: attendanceData } = await supabaseAdmin
        .from('students')
        .select(`
          id,
          attendance!inner(date, present)
        `)
        .eq('church_id', churchId)
        .in('class_id', classIds)
        .eq('attendance.date', today);

      const presentCount = attendanceData?.filter((s: any) =>
        s.attendance.some((a: any) => a.present)
      ).length || 0;
      const attendanceRate = totalStudents && totalStudents > 0
        ? Math.round((presentCount / totalStudents) * 100)
        : 0;

      // Get recent tests for teacher's classes
      const { data: tests } = await supabaseAdmin
        .from('tests')
        .select(`
          id,
          name,
          date,
          test_results(status)
        `)
        .eq('church_id', churchId)
        .in('class_id', classIds)
        .order('date', { ascending: false })
        .limit(5);

      const recentTests = (tests || []).map((test: any) => {
        const results = test.test_results || [];
        const passed = results.filter((r: any) => r.status === 'passed').length;
        const total = results.filter((r: any) => r.status !== 'absent').length;
        const passRate = total > 0 ? (passed / total) * 100 : 0;

        return {
          id: test.id,
          name: test.name,
          date: test.date,
          passRate: Math.round(passRate),
          totalStudents: results.length,
        };
      });

      const testPassRate = recentTests.length > 0
        ? Math.round(
            recentTests.reduce((acc, t) => acc + t.passRate, 0) /
              recentTests.length
          )
        : 0;

      response = {
        totalStudents: totalStudents || 0,
        todayAttendanceRate: attendanceRate,
        testPassRate,
        recentTests,
        recentActivity: [],
      };
    } else {
      // For admins, get all stats
      const stats = await getDashboardStats(churchId);
      console.log("Dashboard stats:", stats);

      response = {
        totalStudents: stats.totalStudents,
        todayAttendanceRate: stats.attendanceToday.attendanceRate,
        testPassRate: stats.recentTests.length > 0
          ? Math.round(
              stats.recentTests.reduce((acc, t) => acc + t.passRate, 0) /
                stats.recentTests.length
            )
          : 0,
        recentTests: stats.recentTests,
        recentActivity: [],
      };
    }

    console.log("Sending response:", response);
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in dashboard API:", error);
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return NextResponse.json(
      {
        error: "Failed to fetch dashboard data",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
