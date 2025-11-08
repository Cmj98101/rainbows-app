"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PlusIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { TableRowSkeleton } from "@/components/LoadingStates";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/Animations";

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
  created_at: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete ${userName}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      // Refresh list
      fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete user");
    }
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      church_admin: "badge-primary",
      admin: "badge-secondary",
      teacher: "badge-accent",
    };

    return (
      <span className={`badge ${colors[role as keyof typeof colors] || ""}`}>
        {role.replace("_", " ")}
      </span>
    );
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

        <div className="card bg-base-100 shadow-xl">
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Permissions</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <TableRowSkeleton columns={5} />
                <TableRowSkeleton columns={5} />
                <TableRowSkeleton columns={5} />
                <TableRowSkeleton columns={5} />
                <TableRowSkeleton columns={5} />
              </tbody>
            </table>
          </div>
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
          <h1 className="text-2xl font-bold">User Management</h1>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link href="/admin/users/add" className="btn btn-primary">
              <PlusIcon className="h-5 w-5 mr-2" />
              Add User
            </Link>
          </motion.div>
        </motion.div>

      <div className="card bg-base-100 shadow-xl">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Permissions</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="font-medium">{user.name}</td>
                  <td>{user.email}</td>
                  <td>{getRoleBadge(user.role)}</td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {user.permissions.canManageUsers && (
                        <span className="badge badge-xs">Users</span>
                      )}
                      {user.permissions.canManageClasses && (
                        <span className="badge badge-xs">Classes</span>
                      )}
                      {user.permissions.canEditStudents && (
                        <span className="badge badge-xs">Students</span>
                      )}
                      {user.permissions.canTakeAttendance && (
                        <span className="badge badge-xs">Attendance</span>
                      )}
                      {user.permissions.canManageTests && (
                        <span className="badge badge-xs">Tests</span>
                      )}
                      {user.permissions.canViewReports && (
                        <span className="badge badge-xs">Reports</span>
                      )}
                    </div>
                  </td>
                  <td className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/users/${user.id}/edit`}
                        className="btn btn-ghost btn-sm"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(user.id, user.name)}
                        className="btn btn-ghost btn-sm text-error"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {users.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No users found</p>
        </div>
      )}
      </div>
    </PageTransition>
  );
}
