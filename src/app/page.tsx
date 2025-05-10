import { Sidebar } from "@/components/Sidebar";
import Link from "next/link";
import QuickAttendanceView from "@/components/QuickAttendanceView";
import { Suspense } from "react";
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

    const testPassRate = tests[0]
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
    <div className="drawer lg:drawer-open">
      <input id="drawer" type="checkbox" className="drawer-toggle" />

      {/* Main Content */}
      <div className="drawer-content flex flex-col">
        <main className="p-4">
          {/* Dashboard Overview */}
          <div className="stats shadow mb-4">
            <div className="stat">
              <div className="stat-title">Total Students</div>
              <div className="stat-value">{data.totalStudents}</div>
            </div>
            <div className="stat">
              <div className="stat-title">Today's Attendance</div>
              <div className="stat-value">{data.todayAttendanceRate}%</div>
            </div>
            <div className="stat">
              <div className="stat-title">Test Pass Rate</div>
              <div className="stat-value">{data.testPassRate}%</div>
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
            {/* <Link href="/tests/new" className="btn btn-accent">
              Record Test Results
            </Link> */}
          </div>
          <QuickAttendanceView />
        </main>
      </div>

      {/* Sidebar */}
      <div className="drawer-side">
        <label htmlFor="drawer" className="drawer-overlay"></label>
        <Sidebar />
      </div>
    </div>
  );
}

async function DashboardContent() {
  const data = await getDashboardData();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-2">Total Students</h2>
        <p className="text-3xl font-bold">{data.totalStudents}</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-2">Today's Attendance</h2>
        <p className="text-3xl font-bold">{data.todayAttendanceRate}%</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-2">Test Pass Rate</h2>
        <p className="text-3xl font-bold">{data.testPassRate}%</p>
      </div>
    </div>
  );
}
