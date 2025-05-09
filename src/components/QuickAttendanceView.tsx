"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  attendance: { date: string; present: boolean }[];
}

function getMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date();
  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
}

export default function QuickAttendanceView() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      setError("");
      try {
        const { startDate, endDate } = getMonthRange();
        const res = await fetch(
          `/api/attendance?startDate=${startDate}&endDate=${endDate}`
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
    fetchAttendance();
  }, []);

  return (
    <div className="card bg-base-100 shadow-xl mb-6">
      <div className="card-body">
        <div className="flex justify-between items-center mb-2">
          <h2 className="card-title">Attendance Quick View (This Month)</h2>
          <Link href="/attendance" className="btn btn-sm btn-primary">
            Full Attendance
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="table table-sm">
            <thead>
              <tr>
                <th>Name</th>
                <th>Present</th>
                <th>Absent</th>
                <th>Rate</th>
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
                    <td>
                      {student.firstName} {student.lastName}
                    </td>
                    <td>{presentDays}</td>
                    <td>{totalDays - presentDays}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-base-200 rounded-full h-2.5">
                          <div
                            className="bg-primary h-2.5 rounded-full"
                            style={{ width: `${attendanceRate}%` }}
                          ></div>
                        </div>
                        <span>{attendanceRate}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {loading && <div className="mt-2">Loading...</div>}
          {error && <div className="text-red-600 mt-2">{error}</div>}
        </div>
      </div>
    </div>
  );
}
