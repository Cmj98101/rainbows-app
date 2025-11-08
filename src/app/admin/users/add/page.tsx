"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AddUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "teacher">("teacher");

  // Permissions
  const [canManageUsers, setCanManageUsers] = useState(false);
  const [canManageClasses, setCanManageClasses] = useState(false);
  const [canEditStudents, setCanEditStudents] = useState(true);
  const [canTakeAttendance, setCanTakeAttendance] = useState(true);
  const [canManageTests, setCanManageTests] = useState(true);
  const [canViewReports, setCanViewReports] = useState(false);

  const handleRoleChange = (newRole: "admin" | "teacher") => {
    setRole(newRole);

    // Set default permissions based on role
    if (newRole === "admin") {
      setCanManageUsers(true);
      setCanManageClasses(true);
      setCanEditStudents(true);
      setCanTakeAttendance(true);
      setCanManageTests(true);
      setCanViewReports(true);
    } else {
      setCanManageUsers(false);
      setCanManageClasses(false);
      setCanEditStudents(true);
      setCanTakeAttendance(true);
      setCanManageTests(true);
      setCanViewReports(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !password) {
      setError("All fields are required");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
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
        throw new Error(data.error || "Failed to create user");
      }

      router.push("/admin/users");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <Link href="/admin/users" className="btn btn-ghost btn-sm">
          ← Back to Users
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">Add New User</h1>

      {error && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card bg-base-100 shadow-xl">
        <div className="card-body space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Full Name</span>
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
              <span className="label-text">Email</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input input-bordered"
              placeholder="john@example.com"
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Password</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input input-bordered"
              placeholder="Minimum 6 characters"
              required
              minLength={6}
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Role</span>
            </label>
            <select
              value={role}
              onChange={(e) =>
                handleRoleChange(e.target.value as "admin" | "teacher")
              }
              className="select select-bordered"
            >
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
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
                "Create User"
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
