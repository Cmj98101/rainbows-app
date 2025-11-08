"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface ClassData {
  _id: string;
  name: string;
  ageGroup?: string;
  description?: string;
  schedule?: string;
  teachers: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
}

export default function EditClassPage() {
  const router = useRouter();
  const params = useParams();
  const classId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [teachers, setTeachers] = useState<User[]>([]);
  const [classData, setClassData] = useState<ClassData | null>(null);

  const [name, setName] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [description, setDescription] = useState("");
  const [schedule, setSchedule] = useState("");
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);

  useEffect(() => {
    if (classId) {
      fetchClassData();
      fetchTeachers();
    }
  }, [classId]);

  const fetchClassData = async () => {
    try {
      const response = await fetch(`/api/classes/${classId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch class data");
      }

      const data = await response.json();
      setClassData(data);
      setName(data.name || "");
      setAgeGroup(data.ageGroup || "");
      setDescription(data.description || "");
      setSchedule(data.schedule || "");
      setSelectedTeachers(data.teachers?.map((t: any) => t.id) || []);
    } catch (err) {
      console.error("Error fetching class:", err);
      setError(err instanceof Error ? err.message : "Failed to load class");
    } finally {
      setLoading(false);
    }
  };

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

    setSaving(true);

    try {
      const response = await fetch(`/api/classes/${classId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          ageGroup,
          description,
          schedule,
          teacherIds: selectedTeachers,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update class");
      }

      router.push("/admin/classes");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update class");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error && !classData) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
        <Link href="/admin/classes" className="btn btn-ghost mt-4">
          ← Back to Classes
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <Link href="/admin/classes" className="btn btn-ghost btn-sm">
          ← Back to Classes
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">Edit Class</h1>

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

          <div className="form-control">
            <label className="label">
              <span className="label-text">Schedule</span>
            </label>
            <input
              type="text"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              className="input input-bordered"
              placeholder="e.g., Sundays 9:00 AM"
            />
          </div>

          <div className="divider">Assign Teachers</div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Select Teachers</span>
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-2">
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
            {selectedTeachers.length > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                {selectedTeachers.length} teacher(s) selected
              </p>
            )}
          </div>

          <div className="card-actions justify-end mt-6">
            <Link href="/admin/classes" className="btn btn-ghost">
              Cancel
            </Link>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
