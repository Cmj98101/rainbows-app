"use client";
import Link from "next/link";
import { useState, useMemo } from "react";
import { Student } from "@/types/student";
import { StatCardSkeleton, AccordionSkeleton, TableRowSkeleton } from "@/components/LoadingStates";
import { motion } from "framer-motion";
import { PageTransition, staggerContainer, staggerItem } from "@/components/Animations";

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

type ViewMode = "grouped" | "table";

function StudentRow({ student, showClass = false }: { student: Student; showClass?: boolean }) {
  const primaryGuardian = student.guardians?.[0];
  return (
    <tr>
      <td className="font-medium">
        {`${student.firstName} ${student.lastName}`}
      </td>
      {showClass && (
        <td>
          <span className="badge badge-outline">{student.className || "Unassigned"}</span>
        </td>
      )}
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
  const [viewMode, setViewMode] = useState<ViewMode>("grouped");
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");

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

  // Get all students from grouped data for table view
  const allStudents = useMemo(() => {
    if (data.grouped) {
      return data.grouped.flatMap(group => group.students);
    }
    return data.students || [];
  }, [data]);

  // Get unique classes for filter dropdown
  const classes = useMemo(() => {
    if (data.grouped) {
      return data.grouped.map(g => ({ id: g.classId, name: g.className }));
    }
    return [];
  }, [data]);

  // Filter and search students
  const filteredStudents = useMemo(() => {
    let filtered = [...allStudents];

    // Filter by class
    if (classFilter !== "all") {
      filtered = filtered.filter(s => s.classId === classFilter);
    }

    // Search by name or guardian
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => {
        const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
        const guardianName = s.guardians?.[0]?.name?.toLowerCase() || "";
        return fullName.includes(query) || guardianName.includes(query);
      });
    }

    return sortStudents(filtered);
  }, [allStudents, classFilter, searchQuery, sortBy]);

  // Calculate stats
  const stats = useMemo(() => {
    return {
      total: allStudents.length,
      byClass: data.grouped?.map(g => ({
        className: g.className,
        count: g.students.length
      })) || []
    };
  }, [allStudents, data.grouped]);

  // Render admin view with multiple options
  if (data.isGrouped && data.grouped) {
    return (
      <PageTransition>
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <motion.div
            className="flex justify-between items-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div>
              <h1 className="text-2xl font-bold">Students</h1>
              <p className="text-sm text-gray-600 mt-1">
                {stats.total} total student{stats.total !== 1 ? 's' : ''} across {data.grouped.length} class{data.grouped.length !== 1 ? 'es' : ''}
              </p>
            </div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link href="/students/add" className="btn btn-primary">
                Add Student
              </Link>
            </motion.div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={staggerItem} className="stat bg-base-100 shadow rounded-lg">
              <div className="stat-title">Total Students</div>
              <div className="stat-value text-primary">{stats.total}</div>
            </motion.div>
            {stats.byClass.slice(0, 3).map((classInfo, idx) => (
              <motion.div
                key={idx}
                variants={staggerItem}
                className="stat bg-base-100 shadow rounded-lg"
              >
                <div className="stat-title">{classInfo.className}</div>
                <div className="stat-value text-2xl">{classInfo.count}</div>
              </motion.div>
            ))}
          </motion.div>

        {/* View Controls */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              {/* View Mode Toggle */}
              <div className="flex gap-2">
                <button
                  className={`btn btn-sm ${viewMode === "grouped" ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => setViewMode("grouped")}
                >
                  By Class
                </button>
                <button
                  className={`btn btn-sm ${viewMode === "table" ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => setViewMode("table")}
                >
                  All Students
                </button>
              </div>

              {/* Search and Filter */}
              <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                <input
                  type="text"
                  placeholder="Search students..."
                  className="input input-bordered input-sm w-full md:w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {viewMode === "table" && (
                  <select
                    className="select select-bordered select-sm"
                    value={classFilter}
                    onChange={(e) => setClassFilter(e.target.value)}
                  >
                    <option value="all">All Classes</option>
                    {classes.map((cls) => (
                      <option key={cls.id || 'unassigned'} value={cls.id || ''}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                )}
                {viewMode === "table" && (
                  <select
                    className="select select-bordered select-sm"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as "first" | "last" | "full")}
                  >
                    <option value="full">Full Name</option>
                    <option value="first">First Name</option>
                    <option value="last">Last Name</option>
                  </select>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Grouped View */}
        {viewMode === "grouped" && (
          <motion.div
            className="space-y-4"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            {data.grouped.map((group, idx) => {
              const isOpen = openAccordions.has(group.classId || 'unassigned');
              const groupStudents = searchQuery
                ? group.students.filter(s => {
                    const query = searchQuery.toLowerCase();
                    const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
                    const guardianName = s.guardians?.[0]?.name?.toLowerCase() || "";
                    return fullName.includes(query) || guardianName.includes(query);
                  })
                : group.students;
              const sortedStudents = sortStudents(groupStudents);

              if (searchQuery && groupStudents.length === 0) return null;

              return (
                <motion.div
                  key={group.classId || 'unassigned'}
                  variants={staggerItem}
                  className="collapse collapse-arrow bg-base-100 shadow-xl"
                  whileHover={{
                    boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)"
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <input
                    type="checkbox"
                    checked={isOpen}
                    onChange={() => toggleAccordion(group.classId || 'unassigned')}
                  />
                  <div className="collapse-title text-xl font-medium flex items-center justify-between">
                    <span>{group.className}</span>
                    <span className="badge badge-lg badge-primary">
                      {sortedStudents.length} student{sortedStudents.length !== 1 ? 's' : ''}
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
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Table View */}
        {viewMode === "table" && (
          <div className="card bg-base-100 shadow-xl">
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Class</th>
                    <th>Guardian</th>
                    <th>Phone</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <StudentRow key={student._id} student={student} showClass />
                  ))}
                </tbody>
              </table>
            </div>
            {filteredStudents.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">
                  {searchQuery || classFilter !== "all" ? "No students match your filters" : "No students found"}
                </p>
              </div>
            )}
          </div>
        )}

        {data.grouped.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No students found</p>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link href="/students/add" className="btn btn-primary">
                Add Your First Student
              </Link>
            </motion.div>
          </div>
        )}
        </div>
      </PageTransition>
    );
  }

  // Render flat view (for teachers)
  const sortedStudents = sortStudents(data.students || []);

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div
          className="flex justify-between items-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
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
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link href="/students/add" className="btn btn-primary">
                Add Student
              </Link>
            </motion.div>
          </div>
        </motion.div>

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
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link href="/students/add" className="btn btn-primary">
              Add Your First Student
            </Link>
          </motion.div>
        </div>
      )}
      </div>
    </PageTransition>
  );
}
