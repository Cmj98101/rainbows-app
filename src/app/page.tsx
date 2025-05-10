import { Sidebar } from "@/components/Sidebar";
import Link from "next/link";
import QuickAttendanceView from "@/components/QuickAttendanceView";
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

async function getDashboardData() {
  const baseUrl =
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : `https://${process.env.VERCEL_URL}`;

  const res = await fetch(`${baseUrl}/api/dashboard`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch dashboard data");
  }

  return res.json();
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
