"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  attendance: { date: string; present: boolean }[];
}

function getTodayISO() {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

function getMonthRange(monthsAgo: number) {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - monthsAgo);
  start.setDate(1);
  end.setDate(0);
  return {
    startDate: start.toISOString().split("T")[0],
    endDate: getTodayISO(),
  };
}

export default function AttendanceSummaryPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    now.setDate(1);
    return now.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(getTodayISO());

  const fetchAttendance = async (start: string, end: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/attendance?startDate=${start}&endDate=${end}`
      );
      if (!res.ok) throw new Error("Failed to fetch attendance");
      const data: Student[] = await res.json();
      setStudents(data);
    } catch (err) {
      setError("Failed to load attendance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance(startDate, endDate);
  }, [startDate, endDate]);

  const handleQuickFilter = (months: number) => {
    if (months === 1) {
      // This month
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(start.toISOString().split("T")[0]);
      setEndDate(getTodayISO());
    } else if (months === -1) {
      // Last month
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      setStartDate(start.toISOString().split("T")[0]);
      setEndDate(end.toISOString().split("T")[0]);
    } else {
      // Last N months
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
      setStartDate(start.toISOString().split("T")[0]);
      setEndDate(getTodayISO());
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Attendance Summary</h1>
        <Link href="/attendance/take-roll" className="btn btn-primary">
          Take Roll
        </Link>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex flex-wrap gap-2 mb-4">
            <button className="btn btn-sm" onClick={() => handleQuickFilter(1)}>
              This Month
            </button>
            <button
              className="btn btn-sm"
              onClick={() => handleQuickFilter(-1)}
            >
              Last Month
            </button>
            <button className="btn btn-sm" onClick={() => handleQuickFilter(3)}>
              Last 3 Months
            </button>
            <button className="btn btn-sm" onClick={() => handleQuickFilter(6)}>
              Last 6 Months
            </button>
          </div>
          <form
            className="flex flex-wrap gap-4 items-end"
            onSubmit={(e) => {
              e.preventDefault();
              fetchAttendance(startDate, endDate);
            }}
          >
            <div className="form-control">
              <label className="label">
                <span className="label-text">Start Date</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input input-bordered input-sm"
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">End Date</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input input-bordered input-sm"
              />
            </div>
            <button type="submit" className="btn btn-sm btn-primary">
              Apply
            </button>
          </form>
        </div>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Present Days</th>
                  <th>Absent Days</th>
                  <th>Attendance Rate</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const presentDays = student.attendance.filter((a) => {
                    let presentValue = a.present;
                    if (
                      typeof presentValue === "undefined" &&
                      typeof a === "object" &&
                      "_doc" in a &&
                      a._doc !== null &&
                      typeof a._doc === "object" &&
                      "present" in (a._doc as any)
                    ) {
                      presentValue = (a._doc as any).present;
                    }
                    return presentValue === true;
                  }).length;
                  const totalDays = student.attendance.length;
                  const attendanceRate =
                    totalDays > 0
                      ? Math.round((presentDays / totalDays) * 100)
                      : 0;
                  return (
                    <tr key={student._id}>
                      <td className="font-medium">
                        {student.firstName} {student.lastName}
                      </td>
                      <td>{presentDays}</td>
                      <td>{totalDays - presentDays}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <progress
                            className="progress progress-primary w-16"
                            value={attendanceRate}
                            max="100"
                          ></progress>
                          <span>{attendanceRate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {loading && (
            <div className="flex justify-center mt-4">
              <span className="loading loading-spinner loading-md"></span>
            </div>
          )}
          {error && (
            <div className="alert alert-error mt-4">
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
