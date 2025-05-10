import { Sidebar } from "@/components/Sidebar";
import Link from "next/link";
import QuickAttendanceView from "@/components/QuickAttendanceView";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import Student from "@/models/Student";
import Attendance from "@/models/Attendance";
import Test from "@/models/Test";

async function getDashboardData() {
  try {
    await connectDB();

    const [totalStudents, todayAttendance, tests] = await Promise.all([
      Student.countDocuments(),
      Attendance.findOne({ date: new Date().toISOString().split("T")[0] }),
      Test.find().sort({ date: -1 }).limit(1),
    ]);

    const todayAttendanceRate = todayAttendance
      ? (todayAttendance.present.length / totalStudents) * 100
      : 0;

    const testPassRate =
      tests[0] && tests[0].totalCount > 0
        ? (tests[0].passCount / tests[0].totalCount) * 100
        : 0;

    return {
      totalStudents,
      todayAttendanceRate: Math.round(todayAttendanceRate),
      testPassRate: Math.round(testPassRate),
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    throw new Error("Failed to fetch dashboard data");
  }
}

export default async function Home() {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/signin");
  }

  const data = await getDashboardData();

  return (
    <main className="p-4">
      {/* Dashboard Overview */}
      <div className="stats shadow mb-4">
        <div className="stat">
          <div className="stat-title">Total Students</div>
          <div className="stat-value">{data.totalStudents}</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4 mb-4">
        <Link href="/attendance/take-roll" className="btn btn-primary">
          Take Roll
        </Link>
        <Link href="/students/add" className="btn btn-secondary">
          Add New Student
        </Link>
      </div>
      <QuickAttendanceView />
    </main>
  );
}
