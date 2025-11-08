"use client";

import Link from "next/link";
import { Suspense } from "react";
import { StatCardSkeleton, ClassCardSkeleton, LoadingSpinner } from "./LoadingStates";

interface DashboardContentProps {
  stats: {
    totalStudents: number;
    todayAttendanceRate: number;
    testPassRate: number;
    recentTests: any[];
    recentActivity: any[];
  };
  classSummary: any[] | null;
  isAdmin: boolean;
}

export function DashboardStats({
  stats,
  isAdmin,
  classCount
}: Pick<DashboardContentProps, 'stats' | 'isAdmin'> & { classCount?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="stat bg-base-100 shadow rounded-lg">
        <div className="stat-title">Total Students</div>
        <div className="stat-value text-primary">{stats.totalStudents || 0}</div>
        <div className="stat-desc">{isAdmin ? 'Across all classes' : 'In your classes'}</div>
      </div>
      {isAdmin && (
        <>
          <div className="stat bg-base-100 shadow rounded-lg">
            <div className="stat-title">Recent Tests</div>
            <div className="stat-value text-2xl">{stats.recentTests?.length || 0}</div>
            <div className="stat-desc">
              {stats.testPassRate}% average pass rate
            </div>
          </div>
          <div className="stat bg-base-100 shadow rounded-lg">
            <div className="stat-title">Classes</div>
            <div className="stat-value text-2xl">{classCount || 0}</div>
            <div className="stat-desc">Active classes</div>
          </div>
        </>
      )}
    </div>
  );
}

export function DashboardStatsLoading({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCardSkeleton />
      {isAdmin && (
        <>
          <StatCardSkeleton />
          <StatCardSkeleton />
        </>
      )}
    </div>
  );
}

export function QuickActions({ isAdmin }: { isAdmin: boolean }) {
  return (
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
  );
}

export function ClassOverview({ classSummary }: { classSummary: any[] }) {
  return (
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
  );
}

export function ClassOverviewLoading() {
  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex justify-between items-center mb-4">
          <div className="h-6 bg-gray-300 rounded w-32 animate-pulse"></div>
          <div className="h-8 bg-gray-300 rounded w-24 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ClassCardSkeleton />
          <ClassCardSkeleton />
          <ClassCardSkeleton />
        </div>
      </div>
    </div>
  );
}

export function RecentTests({ tests }: { tests: any[] }) {
  return (
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
              {tests.slice(0, 5).map((test: any) => (
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
  );
}
