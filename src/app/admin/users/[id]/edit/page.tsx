"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface User {
  id: string;
  name: string;
  email: string;
  role: "church_admin" | "admin" | "teacher";
  permissions: {
    canManageUsers: boolean;
    canManageClasses: boolean;
    canEditStudents: boolean;
    canTakeAttendance: boolean;
    canManageTests: boolean;
    canViewReports: boolean;
  };
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<User | null>(null);

  const [name, setName] = useState("");
  const [role, setRole] = useState<"church_admin" | "admin" | "teacher">("teacher");

  // Permissions
  const [canManageUsers, setCanManageUsers] = useState(false);
  const [canManageClasses, setCanManageClasses] = useState(false);
  const [canEditStudents, setCanEditStudents] = useState(true);
  const [canTakeAttendance, setCanTakeAttendance] = useState(true);
  const [canManageTests, setCanManageTests] = useState(true);
  const [canViewReports, setCanViewReports] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchUser();
    }
  }, [userId]);

  const fetchUser = async () => {
    try {
      const response = await fetch(`/api/users/${userId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch user");
      }

      const data = await response.json();
      setUser(data);
      setName(data.name);
      setRole(data.role);
      setCanManageUsers(data.permissions?.canManageUsers || false);
      setCanManageClasses(data.permissions?.canManageClasses || false);
      setCanEditStudents(data.permissions?.canEditStudents || false);
      setCanTakeAttendance(data.permissions?.canTakeAttendance || false);
      setCanManageTests(data.permissions?.canManageTests || false);
      setCanViewReports(data.permissions?.canViewReports || false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load user");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (newRole: "church_admin" | "admin" | "teacher") => {
    setRole(newRole);

    // Set default permissions based on role
    if (newRole === "church_admin") {
      setCanManageUsers(true);
      setCanManageClasses(true);
      setCanEditStudents(true);
      setCanTakeAttendance(true);
      setCanManageTests(true);
      setCanViewReports(true);
    } else if (newRole === "admin") {
      setCanManageUsers(true);
      setCanManageClasses(true);
      setCanEditStudents(true);
      setCanTakeAttendance(true);
      setCanManageTests(true);
      setCanViewReports(true);
    } else {
      // Keep current permissions for teacher
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name) {
      setError("Name is required");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          role,
          permissions: {
            canManageUsers,
            canManageClasses,
            canEditStudents,
            canTakeAttendance,
            canManageTests,
            canViewReports,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update user");
      }

      router.push("/admin/users");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user");
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

  if (error && !user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="alert alert-error mb-6">
          <span>{error}</span>
        </div>
        <Link href="/admin/users" className="btn btn-ghost">
          ← Back to Users
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <Link href="/admin/users" className="btn btn-ghost btn-sm">
          ← Back to Users
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">Edit User</h1>

      {error && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card bg-base-100 shadow-xl">
        <div className="card-body space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Email</span>
            </label>
            <input
              type="email"
              value={user?.email || ""}
              className="input input-bordered"
              disabled
              readOnly
            />
            <label className="label">
              <span className="label-text-alt text-gray-500">
                Email cannot be changed
              </span>
            </label>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Full Name *</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input input-bordered"
              placeholder="John Doe"
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Role *</span>
            </label>
            <select
              value={role}
              onChange={(e) =>
                handleRoleChange(e.target.value as "church_admin" | "admin" | "teacher")
              }
              className="select select-bordered"
            >
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
              <option value="church_admin">Church Admin</option>
            </select>
          </div>

          <div className="divider">Permissions</div>

          <div className="form-control">
            <label className="label cursor-pointer">
              <span className="label-text">Manage Users</span>
              <input
                type="checkbox"
                checked={canManageUsers}
                onChange={(e) => setCanManageUsers(e.target.checked)}
                className="checkbox"
              />
            </label>
            <label className="label">
              <span className="label-text-alt text-gray-500">
                Create, edit, and delete users
              </span>
            </label>
          </div>

          <div className="form-control">
            <label className="label cursor-pointer">
              <span className="label-text">Manage Classes</span>
              <input
                type="checkbox"
                checked={canManageClasses}
                onChange={(e) => setCanManageClasses(e.target.checked)}
                className="checkbox"
              />
            </label>
            <label className="label">
              <span className="label-text-alt text-gray-500">
                Create, edit, and assign teachers to classes
              </span>
            </label>
          </div>

          <div className="form-control">
            <label className="label cursor-pointer">
              <span className="label-text">Edit Students</span>
              <input
                type="checkbox"
                checked={canEditStudents}
                onChange={(e) => setCanEditStudents(e.target.checked)}
                className="checkbox"
              />
            </label>
            <label className="label">
              <span className="label-text-alt text-gray-500">
                Add and edit student information
              </span>
            </label>
          </div>

          <div className="form-control">
            <label className="label cursor-pointer">
              <span className="label-text">Take Attendance</span>
              <input
                type="checkbox"
                checked={canTakeAttendance}
                onChange={(e) => setCanTakeAttendance(e.target.checked)}
                className="checkbox"
              />
            </label>
            <label className="label">
              <span className="label-text-alt text-gray-500">
                Record student attendance
              </span>
            </label>
          </div>

          <div className="form-control">
            <label className="label cursor-pointer">
              <span className="label-text">Manage Tests</span>
              <input
                type="checkbox"
                checked={canManageTests}
                onChange={(e) => setCanManageTests(e.target.checked)}
                className="checkbox"
              />
            </label>
            <label className="label">
              <span className="label-text-alt text-gray-500">
                Create and grade tests
              </span>
            </label>
          </div>

          <div className="form-control">
            <label className="label cursor-pointer">
              <span className="label-text">View Reports</span>
              <input
                type="checkbox"
                checked={canViewReports}
                onChange={(e) => setCanViewReports(e.target.checked)}
                className="checkbox"
              />
            </label>
            <label className="label">
              <span className="label-text-alt text-gray-500">
                Access attendance and performance reports
              </span>
            </label>
          </div>

          <div className="card-actions justify-end mt-6">
            <Link href="/admin/users" className="btn btn-ghost">
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
