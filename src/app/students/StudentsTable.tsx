"use client";
import Link from "next/link";
import { useState } from "react";
import { Student } from "@/types/student";

interface GroupedData {
  classId: string | null;
  className: string;
  students: Student[];
}

interface StudentsTableProps {
  data: {
    students?: Student[];
    grouped?: GroupedData[];
    isGrouped: boolean;
  };
}

function StudentRow({ student }: { student: Student }) {
  const primaryGuardian = student.guardians?.[0];
  return (
    <tr>
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
}

export default function StudentsTable({ data }: StudentsTableProps) {
  const [sortBy, setSortBy] = useState<"first" | "last" | "full">("full");
  const [openAccordions, setOpenAccordions] = useState<Set<string>>(new Set());

  const toggleAccordion = (classId: string) => {
    setOpenAccordions((prev) => {
      const next = new Set(prev);
      if (next.has(classId)) {
        next.delete(classId);
      } else {
        next.add(classId);
      }
      return next;
    });
  };

  const sortStudents = (students: Student[]) => {
    return [...students].sort((a, b) => {
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
  };

  // Render grouped view (for admins)
  if (data.isGrouped && data.grouped) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Students by Class</h1>
          <Link href="/students/add" className="btn btn-primary">
            Add Student
          </Link>
        </div>

        <div className="space-y-4">
          {data.grouped.map((group) => {
            const isOpen = openAccordions.has(group.classId || 'unassigned');
            const sortedStudents = sortStudents(group.students);

            return (
              <div key={group.classId || 'unassigned'} className="collapse collapse-arrow bg-base-100 shadow-xl">
                <input
                  type="checkbox"
                  checked={isOpen}
                  onChange={() => toggleAccordion(group.classId || 'unassigned')}
                />
                <div className="collapse-title text-xl font-medium flex items-center justify-between">
                  <span>{group.className}</span>
                  <span className="badge badge-lg badge-primary">
                    {group.students.length} student{group.students.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="collapse-content">
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
                        {sortedStudents.map((student) => (
                          <StudentRow key={student._id} student={student} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {data.grouped.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No students found</p>
            <Link href="/students/add" className="btn btn-primary">
              Add Your First Student
            </Link>
          </div>
        )}
      </div>
    );
  }

  // Render flat view (for teachers)
  const sortedStudents = sortStudents(data.students || []);

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
              {sortedStudents.map((student) => (
                <StudentRow key={student._id} student={student} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {sortedStudents.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No students found</p>
          <Link href="/students/add" className="btn btn-primary">
            Add Your First Student
          </Link>
        </div>
      )}
    </div>
  );
}
