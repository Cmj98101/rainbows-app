"use client";

import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";

interface ExportButtonProps {
  students: any[];
}

export function ExportButton({ students }: ExportButtonProps) {
  const exportAttendanceData = () => {
    const csvContent = [
      ["Student Name", "Date", "Status", "Attendance Rate"],
      ...students.flatMap((student) =>
        student.attendance.map((record: any) => [
          `${student.firstName} ${student.lastName}`,
          new Date(record.date).toLocaleDateString(),
          record.present ? "Present" : "Absent",
          `${Math.round(
            (student.attendance.filter((a: any) => a.present).length /
              student.attendance.length) *
              100
          )}%`,
        ])
      ),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `attendance-export-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    link.click();
  };

  return (
    <button onClick={exportAttendanceData} className="btn btn-outline">
      <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
      Export Data
    </button>
  );
}
