"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PlusIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { ClassCardSkeleton } from "@/components/LoadingStates";
import { motion } from "framer-motion";
import { PageTransition, staggerContainer, staggerItem } from "@/components/Animations";

interface Class {
  id: string;
  name: string;
  age_group?: string;
  description?: string;
  teachers: Array<{
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchClasses();

    // Refetch when window regains focus (handles navigation back to this page)
    const handleFocus = () => {
      fetchClasses();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const fetchClasses = async () => {
    try {
      // Add cache-busting timestamp to ensure fresh data
      const response = await fetch(`/api/classes?_t=${Date.now()}`, {
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error("Failed to fetch classes");
      }

      const data = await response.json();
      setClasses(data);
    } catch (err) {
      console.error('Error fetching classes:', err);
      setError(err instanceof Error ? err.message : "Failed to load classes");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (classId: string, className: string) => {
    if (!confirm(`Are you sure you want to delete ${className}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/classes/${classId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete class");
      }

      fetchClasses();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete class");
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 p-4">
        <div className="flex justify-between items-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-48"></div>
          </div>
          <div className="h-10 bg-gray-300 rounded w-24 animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ClassCardSkeleton />
          <ClassCardSkeleton />
          <ClassCardSkeleton />
          <ClassCardSkeleton />
          <ClassCardSkeleton />
          <ClassCardSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto space-y-6 p-4">
        <motion.div
          className="flex justify-between items-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-2xl font-bold">Class Management</h1>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link href="/admin/classes/add" className="btn btn-primary">
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Class
            </Link>
          </motion.div>
        </motion.div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        {classes.map((classItem) => (
          <motion.div
            key={classItem.id}
            variants={staggerItem}
            className="card bg-base-100 shadow-xl"
            whileHover={{
              y: -4,
              boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)"
            }}
            transition={{ duration: 0.2 }}
          >
            <div className="card-body">
              <h2 className="card-title">{classItem.name}</h2>
              {classItem.age_group && (
                <div className="badge badge-secondary">{classItem.age_group}</div>
              )}
              {classItem.description && (
                <p className="text-sm text-gray-600">{classItem.description}</p>
              )}

              <div className="divider my-2"></div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Teachers:</p>
                {classItem.teachers && classItem.teachers.length > 0 ? (
                  <div className="space-y-1">
                    {classItem.teachers.map((teacher) => (
                      <div key={teacher.user.id} className="text-sm">
                        {teacher.user.name}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No teachers assigned</p>
                )}
              </div>

              <div className="card-actions justify-end mt-4">
                <Link
                  href={`/admin/classes/${classItem.id}/edit`}
                  className="btn btn-ghost btn-sm"
                >
                  <PencilIcon className="h-4 w-4" />
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(classItem.id, classItem.name)}
                  className="btn btn-ghost btn-sm text-error"
                >
                  <TrashIcon className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {classes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No classes found</p>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link href="/admin/classes/add" className="btn btn-primary">
              Create Your First Class
            </Link>
          </motion.div>
        </div>
      )}
      </div>
    </PageTransition>
  );
}
