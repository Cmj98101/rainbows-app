import { Sidebar } from "@/components/Sidebar";
import Link from "next/link";
import QuickAttendanceView from "@/components/QuickAttendanceView";

async function getDashboardData() {
  const res = await fetch(`/api/dashboard`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch dashboard data");
  return res.json();
}

export default async function Home() {
  const { totalStudents, todayAttendanceRate, testPassRate } =
    await getDashboardData();

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
              <div className="stat-value">{totalStudents}</div>
            </div>
            <div className="stat">
              <div className="stat-title">Today's Attendance</div>
              <div className="stat-value">{todayAttendanceRate}%</div>
            </div>
            <div className="stat">
              <div className="stat-title">Test Pass Rate</div>
              <div className="stat-value">{testPassRate}%</div>
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
