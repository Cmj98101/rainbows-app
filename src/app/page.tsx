import { Sidebar } from "@/components/Sidebar";
import Link from "next/link";
import QuickAttendanceView from "@/components/QuickAttendanceView";
import { redirect } from "next/navigation";
import { getDashboardStats } from "@/lib/supabase-helpers";
import { getCurrentChurchId, getSession, hasRole, getCurrentUserId } from "@/lib/auth-helpers";
import { supabaseAdmin } from "@/lib/supabase";

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat bg-base-100 shadow rounded-lg">
          <div className="stat-title">Total Students</div>
          <div className="stat-value text-primary">{stats.totalStudents || 0}</div>
          <div className="stat-desc">Across all classes</div>
        </div>
        <div className="stat bg-base-100 shadow rounded-lg">
          <div className="stat-title">Recent Tests</div>
          <div className="stat-value text-2xl">{stats.recentTests?.length || 0}</div>
          <div className="stat-desc">
            {stats.testPassRate}% average pass rate
          </div>
        </div>
        <div className="stat bg-base-100 shadow rounded-lg">
          <div className="stat-title">Classes</div>
          <div className="stat-value text-2xl">{classSummary?.length || 0}</div>
          <div className="stat-desc">Active classes</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Quick Actions</h2>
          <div className="flex flex-wrap gap-2">
            <Link href="/attendance/take-roll" className="btn btn-primary">
              Take Attendance
            </Link>
            <Link href="/students/add" className="btn btn-secondary">
              Add Student
            </Link>
            <Link href="/tests/add" className="btn btn-accent">
              Add Test
            </Link>
            {isAdmin && (
              <>
                <Link href="/admin/classes/add" className="btn btn-ghost">
                  Create Class
                </Link>
                <Link href="/admin/users/add" className="btn btn-ghost">
                  Add User
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Class Summary for Admins */}
      {isAdmin && classSummary && classSummary.length > 0 && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex justify-between items-center mb-4">
              <h2 className="card-title">Class Overview</h2>
              <Link href="/admin/classes" className="btn btn-sm btn-ghost">
                Manage Classes
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classSummary.map((cls: any) => (
                <div key={cls.id} className="card bg-base-200">
                  <div className="card-body">
                    <h3 className="card-title text-lg">{cls.name}</h3>
                    {cls.ageGroup && (
                      <p className="badge badge-secondary badge-sm">{cls.ageGroup}</p>
                    )}
                    <div className="space-y-2 mt-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Students:</span>
                        <span className="font-semibold">{cls.studentCount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Teachers:</span>
                        <span className="font-semibold">{cls.teacherCount}</span>
                      </div>
                      {cls.teachers.length > 0 && (
                        <div className="text-xs text-gray-500 mt-2">
                          {cls.teachers.join(', ')}
                        </div>
                      )}
                    </div>
                    <div className="card-actions justify-end mt-4">
                      <Link
                        href={`/admin/classes/${cls.id}/edit`}
                        className="btn btn-xs btn-ghost"
                      >
                        Manage
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Tests */}
      {stats.recentTests && stats.recentTests.length > 0 && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex justify-between items-center mb-4">
              <h2 className="card-title">Recent Tests</h2>
              <Link href="/tests" className="btn btn-sm btn-ghost">
                View All
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Test Name</th>
                    <th>Date</th>
                    <th>Pass Rate</th>
                    <th>Students</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentTests.slice(0, 5).map((test: any) => (
                    <tr key={test.id}>
                      <td className="font-medium">{test.name}</td>
                      <td>{new Date(test.date).toLocaleDateString()}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span>{test.passRate}%</span>
                          <progress
                            className="progress progress-primary w-20"
                            value={test.passRate}
                            max="100"
                          ></progress>
                        </div>
                      </td>
                      <td>{test.totalStudents}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <QuickAttendanceView />
    </main>
  );
}
