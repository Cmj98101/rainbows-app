"use client";
import Link from "next/link";
import { useState } from "react";
import { Student } from "@/types/student";

export default function StudentsTable({ students }: { students: Student[] }) {
  const [sortBy, setSortBy] = useState<"first" | "last" | "full">("full");

  const sortedStudents = [...students].sort((a, b) => {
    if (sortBy === "first") {
      return a.firstName.localeCompare(b.firstName);
    } else if (sortBy === "last") {
      return a.lastName.localeCompare(b.lastName);
    } else {
      const aFull = `${a.firstName} ${a.lastName}`;
      const bFull = `${b.firstName} ${b.lastName}`;
      return aFull.localeCompare(bFull);
    }
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Students</h1>
        <div className="flex gap-2 items-center">
          <label className="font-medium">Sort by:</label>
          <select
            className="select select-bordered select-sm"
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as "first" | "last" | "full")
            }
          >
            <option value="first">First Name</option>
            <option value="last">Last Name</option>
            <option value="full">Full Name</option>
          </select>
          <Link href="/students/add" className="btn btn-primary">
            Add Student
          </Link>
        </div>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>Guardian</th>
                <th>Phone</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedStudents.map((student) => {
                const primaryGuardian = student.guardians[0];
                return (
                  <tr key={student._id}>
                    <td className="font-medium">
                      {`${student.firstName} ${student.lastName}`}
                    </td>
                    <td>
                      {primaryGuardian
                        ? `${primaryGuardian.name} (${primaryGuardian.relationship})`
                        : "No guardian"}
                    </td>
                    <td>{primaryGuardian?.phone || "No phone"}</td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/students/${student._id}`}
                          className="btn btn-ghost btn-sm"
                        >
                          View
                        </Link>
                        <Link
                          href={`/students/${student._id}/edit`}
                          className="btn btn-ghost btn-sm"
                        >
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
