"use client";

import { useEffect, useState } from "react";

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  attendance: { date: string; present: boolean }[];
}

interface AttendanceRecord {
  studentId: string;
  date: string;
  present: boolean;
}

function getTodayISO() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function TakeRollPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [date, setDate] = useState(getTodayISO());
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [sortField, setSortField] = useState<"firstName" | "lastName">(
    "lastName"
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      setError("");
      setSuccess("");
      try {
        const res = await fetch(
          `/api/attendance?startDate=${date}&endDate=${date}`
        );
        if (!res.ok) throw new Error("Failed to fetch attendance");
        const data: Student[] = await res.json();
        console.log("Fetched students with attendance:", data); // Debug log
        setStudents(data);
        const att: Record<string, boolean> = {};
        data.forEach((student) => {
          console.log(`\nStudent _id: ${student._id}`);
          console.log("Attendance array:", student.attendance);
          console.log("Selected date:", date);
          const record = student.attendance.find((a) => {
            const rawDate = a.date;
            const recordDate = new Date(a.date).toISOString().split("T")[0];
            const selectedDate = new Date(date).toISOString().split("T")[0];
            const isMatch = recordDate === selectedDate;
            console.log(
              `  Record raw date: ${rawDate}, recordDate: ${recordDate}, selectedDate: ${selectedDate}, match: ${isMatch}`
            );
            return isMatch;
          });
          if (record) {
            // Safely access present value for both plain objects and Mongoose docs
            let presentValue = record.present;
            if (
              typeof presentValue === "undefined" &&
              typeof record === "object" &&
              "_doc" in record &&
              record._doc !== null &&
              typeof record._doc === "object" &&
              "present" in (record._doc as any)
            ) {
              presentValue = (record._doc as any).present;
            }
            att[student._id] = presentValue;
          }
        });
        console.log("Mapped attendance state for UI:", att); // Debug log
        setAttendance(att);
      } catch (err) {
        setError("Failed to load attendance");
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, [date]);

  const handleAttendanceChange = (studentId: string, present: boolean) => {
    setAttendance((prev) => ({ ...prev, [studentId]: present }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const records: AttendanceRecord[] = students.map((student) => ({
        studentId: student._id,
        date,
        present: attendance[student._id] === true,
      }));
      console.log("Submitting attendance records:", records); // Debug log
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(records),
      });
      if (!res.ok) {
        const errorData = await res.json();
        console.error("Attendance save error:", errorData);
        throw new Error("Failed to save attendance");
      }
      setSuccess("Attendance saved!");
    } catch (err) {
      setError("Failed to save attendance");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 px-4 py-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Take Attendance</h1>
      </div>
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-base-content mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input input-bordered input-sm"
              />
            </div>
            <div className="flex gap-4 mb-4">
              <select
                className="select select-bordered select-sm"
                value={sortField}
                onChange={(e) =>
                  setSortField(e.target.value as "firstName" | "lastName")
                }
              >
                <option value="firstName">First Name</option>
                <option value="lastName">Last Name</option>
              </select>
              <select
                className="select select-bordered select-sm"
                value={sortDirection}
                onChange={(e) =>
                  setSortDirection(e.target.value as "asc" | "desc")
                }
              >
                <option value="asc">A–Z</option>
                <option value="desc">Z–A</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="table w-full bg-base-100 text-base-content">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th colSpan={2}>Attendance</th>
                  </tr>
                </thead>
                <tbody>
                  {[...students]
                    .sort((a, b) => {
                      const aValue = a[sortField].toLowerCase();
                      const bValue = b[sortField].toLowerCase();
                      return sortDirection === "asc"
                        ? aValue.localeCompare(bValue)
                        : bValue.localeCompare(aValue);
                    })
                    .map((student) => (
                      <tr key={student._id} className="bg-base-100">
                        <td>
                          {student.firstName} {student.lastName}
                        </td>
                        <td colSpan={2}>
                          <div className="btn-group">
                            <button
                              type="button"
                              className={`btn btn-sm ${
                                attendance[student._id] === true
                                  ? "btn-primary"
                                  : "btn-outline"
                              }`}
                              onClick={() =>
                                handleAttendanceChange(student._id, true)
                              }
                            >
                              Present
                            </button>
                            <button
                              type="button"
                              className={`btn btn-sm ${
                                attendance[student._id] === false ||
                                attendance[student._id] === undefined
                                  ? "btn-error"
                                  : "btn-outline"
                              }`}
                              onClick={() =>
                                handleAttendanceChange(student._id, false)
                              }
                            >
                              Absent
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}
            <div className="flex justify-end">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Attendance"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
