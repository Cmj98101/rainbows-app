import { Sidebar } from "@/components/Sidebar";
import Link from "next/link";
import QuickAttendanceView from "@/components/QuickAttendanceView";
import { redirect } from "next/navigation";
import { getDashboardStats } from "@/lib/supabase-helpers";
import { getCurrentChurchId, getSession, hasRole, getCurrentUserId } from "@/lib/auth-helpers";
import { supabaseAdmin } from "@/lib/supabase";
import { Suspense } from "react";
import {
  DashboardStats,
  DashboardStatsLoading,
  QuickActions,
  ClassOverview,
  ClassOverviewLoading,
  RecentTests
} from "@/components/DashboardContent";
import { LoadingSpinner } from "@/components/LoadingStates";

async function getDashboardData() {
  try {
    // Get session directly (no HTTP call needed)
    const session = await getSession();

    if (!session) {
      throw new Error('Not authenticated');
    }

    const churchId = await getCurrentChurchId();
    const isTeacher = await hasRole('teacher');
    const isAdmin = await hasRole('admin') || await hasRole('church_admin');

    let stats;
    let classSummary = null;

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
        return {
          totalStudents: 0,
          todayAttendanceRate: 0,
          testPassRate: 0,
          recentTests: [],
          recentActivity: [],
        };
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

      stats = {
        totalStudents: totalStudents || 0,
        todayAttendanceRate: attendanceRate,
        testPassRate,
        recentTests,
        recentActivity: [],
      };
    } else {
      // For admins, get all stats
      const allStats = await getDashboardStats(churchId);

      stats = {
        totalStudents: allStats.totalStudents,
        todayAttendanceRate: allStats.attendanceToday.attendanceRate,
        testPassRate: allStats.recentTests.length > 0
          ? Math.round(
              allStats.recentTests.reduce((acc, t) => acc + t.passRate, 0) /
                allStats.recentTests.length
            )
          : 0,
        recentTests: allStats.recentTests,
        recentActivity: [],
      };

      // Get class summary for admins
      const { data: classes } = await supabaseAdmin
        .from('classes')
        .select(`
          id,
          name,
          age_group,
          students(id, first_name, last_name),
          class_teachers(
            user:users(id, name)
          )
        `)
        .eq('church_id', churchId)
        .order('name');

      classSummary = (classes || []).map((cls: any) => ({
        id: cls.id,
        name: cls.name,
        ageGroup: cls.age_group,
        studentCount: cls.students?.length || 0,
        teacherCount: cls.class_teachers?.length || 0,
        teachers: cls.class_teachers?.map((ct: any) => ct.user?.name).filter(Boolean) || [],
      }));
    }

    return {
      stats,
      classSummary,
      isAdmin,
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    throw error;
  }
}

export default async function Home() {
  // Check authentication
  const session = await getSession();

  if (!session) {
    redirect("/auth/signin");
  }

  let dashboardData;
  try {
    dashboardData = await getDashboardData();
  } catch (error) {
    // If auth fails, redirect to signin
    redirect("/auth/signin");
  }

  const { stats, classSummary, isAdmin } = dashboardData;

  return (
    <main className="p-4 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of your church management system</p>
      </div>

      {/* Stats Overview */}
      <Suspense fallback={<DashboardStatsLoading isAdmin={isAdmin} />}>
        <DashboardStats stats={stats} isAdmin={isAdmin} classCount={classSummary?.length || 0} />
      </Suspense>

      {/* Quick Actions */}
      <QuickActions isAdmin={isAdmin} />

      {/* Class Summary for Admins */}
      {isAdmin && classSummary && classSummary.length > 0 && (
        <Suspense fallback={<ClassOverviewLoading />}>
          <ClassOverview classSummary={classSummary} />
        </Suspense>
      )}

      {/* Recent Tests (Admin Only) */}
      {isAdmin && stats.recentTests && stats.recentTests.length > 0 && (
        <Suspense fallback={<LoadingSpinner />}>
          <RecentTests tests={stats.recentTests} />
        </Suspense>
      )}

      <QuickAttendanceView />
    </main>
  );
}
