"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function AddClassPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [teachers, setTeachers] = useState<User[]>([]);

  const [name, setName] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        // Filter to only show teachers and admins
        const teacherUsers = data.filter(
          (u: User) => u.role === "teacher" || u.role === "admin"
        );
        setTeachers(teacherUsers);
      }
    } catch (err) {
      console.error("Failed to fetch teachers:", err);
    }
  };

  const toggleTeacher = (teacherId: string) => {
    setSelectedTeachers((prev) =>
      prev.includes(teacherId)
        ? prev.filter((id) => id !== teacherId)
        : [...prev, teacherId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name) {
      setError("Class name is required");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          ageGroup,
          description,
          teacherIds: selectedTeachers,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create class");
      }

      router.push("/admin/classes");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create class");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <Link href="/admin/classes" className="btn btn-ghost btn-sm">
          ← Back to Classes
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">Add New Class</h1>

      {error && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card bg-base-100 shadow-xl">
        <div className="card-body space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Class Name *</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input input-bordered"
              placeholder="e.g., Kindergarten, 1st Grade"
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Age Group</span>
            </label>
            <input
              type="text"
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value)}
              className="input input-bordered"
              placeholder="e.g., 5-6 years, K-2nd"
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Description</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="textarea textarea-bordered"
              placeholder="Optional description of the class"
              rows={3}
            />
          </div>

          <div className="divider">Assign Teachers</div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Select Teachers (optional)</span>
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {teachers.map((teacher) => (
                <label
                  key={teacher.id}
                  className="flex items-center space-x-2 p-2 hover:bg-base-200 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedTeachers.includes(teacher.id)}
                    onChange={() => toggleTeacher(teacher.id)}
                    className="checkbox checkbox-sm"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{teacher.name}</div>
                    <div className="text-sm text-gray-500">{teacher.email}</div>
                  </div>
                  <span className="badge badge-sm">{teacher.role}</span>
                </label>
              ))}
            </div>
            {teachers.length === 0 && (
              <p className="text-sm text-gray-500 mt-2">
                No teachers available. Add users with teacher or admin role first.
              </p>
            )}
          </div>

          <div className="card-actions justify-end mt-6">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Creating...
                </>
              ) : (
                "Create Class"
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
