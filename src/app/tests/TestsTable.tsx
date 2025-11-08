"use client";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { PageTransition, staggerContainer, staggerItem } from "@/components/Animations";

interface Test {
  _id: string;
  name: string;
  date: string;
  description?: string;
  passRate: number;
  totalStudents: number;
  className?: string;
}

interface GroupedData {
  classId: string | null;
  className: string;
  tests: Test[];
}

interface TestsTableProps {
  data: {
    tests?: Test[];
    grouped?: GroupedData[];
    isGrouped: boolean;
  };
}

function TestRow({ test }: { test: Test }) {
  return (
    <tr>
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
      <td className="text-right">
        <div className="flex justify-end gap-2">
          <Link
            href={`/tests/${test._id}/results`}
            className="btn btn-ghost btn-sm"
          >
            View
          </Link>
          <Link
            href={`/tests/${test._id}/edit`}
            className="btn btn-ghost btn-sm"
          >
            Edit
          </Link>
        </div>
      </td>
    </tr>
  );
}

export default function TestsTable({ data }: TestsTableProps) {
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

  // Render grouped view (for admins)
  if (data.isGrouped && data.grouped) {
    return (
      <PageTransition>
        <div className="max-w-7xl mx-auto space-y-6">
          <motion.div
            className="flex justify-between items-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-2xl font-bold">Tests by Class</h1>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link href="/tests/add" className="btn btn-primary">
                Add Test
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            className="space-y-4"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            {data.grouped.map((group) => {
              const isOpen = openAccordions.has(group.classId || 'unassigned');

              // Calculate average pass rate for the class
              const avgPassRate = group.tests.length > 0
                ? Math.round(group.tests.reduce((sum, t) => sum + t.passRate, 0) / group.tests.length)
                : 0;

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
                <div className="collapse-title text-xl font-medium">
                  <div className="flex items-center justify-between">
                    <span>{group.className}</span>
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-normal text-gray-600">
                        Avg: {avgPassRate}%
                      </div>
                      <span className="badge badge-lg badge-primary">
                        {group.tests.length} test{group.tests.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="collapse-content">
                  <div className="overflow-x-auto">
                    <table className="table w-full">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Date</th>
                          <th>Pass Rate</th>
                          <th className="text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.tests.map((test) => (
                          <TestRow key={test._id} test={test} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {data.grouped.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No tests found</p>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link href="/tests/add" className="btn btn-primary">
                Create Your First Test
              </Link>
            </motion.div>
          </div>
        )}
        </div>
      </PageTransition>
    );
  }

  // Render flat view (for teachers)
  const tests = data.tests || [];

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div
          className="flex justify-between items-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-2xl font-bold">Tests</h1>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link href="/tests/add" className="btn btn-primary">
              Add Test
            </Link>
          </motion.div>
        </motion.div>

      <div className="card bg-base-100 shadow-xl">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>Date</th>
                <th>Pass Rate</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tests.map((test) => (
                <TestRow key={test._id} test={test} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {tests.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No tests found</p>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link href="/tests/add" className="btn btn-primary">
              Create Your First Test
            </Link>
          </motion.div>
        </div>
      )}
      </div>
    </PageTransition>
  );
}
