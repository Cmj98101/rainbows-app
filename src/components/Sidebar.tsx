"use client";

import Link from "next/link";
import { useState } from "react";
import {
  HomeIcon,
  UserGroupIcon,
  CalendarIcon,
  ClipboardDocumentCheckIcon,
  ArrowRightOnRectangleIcon,
  AcademicCapIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { useSession } from "@/contexts/SessionContext";

function SignOutButton() {
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/signout", {
        method: "POST",
        credentials: 'include',
      });
      window.location.href = "/auth/signin";
    } catch (error) {
      console.error("Sign out error:", error);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className="text-red-600 hover:text-red-700 disabled:opacity-50"
    >
      <ArrowRightOnRectangleIcon className="h-5 w-5" />
      {loading ? "Signing out..." : "Sign Out"}
    </button>
  );
}

function closeDrawer() {
  if (typeof window !== "undefined") {
    const drawer = document.getElementById("drawer") as HTMLInputElement | null;
    if (drawer) drawer.checked = false;
  }
}

export function Sidebar() {
  const { session, loading } = useSession();

  const canManageUsers = session?.user?.permissions?.canManageUsers;
  const canManageClasses = session?.user?.permissions?.canManageClasses;

  return (
    <ul className="menu p-4 w-80 min-h-full bg-base-200 text-base-content dark:bg-neutral dark:text-base-100">
      <li className="menu-title">Navigation</li>
      <li>
        <Link
          href="/"
          className="text-base-content dark:text-white"
          onClick={closeDrawer}
        >
          <HomeIcon className="h-5 w-5" />
          Dashboard
        </Link>
      </li>
      <li>
        <Link
          href="/students"
          className="text-base-content dark:text-white"
          onClick={closeDrawer}
        >
          <UserGroupIcon className="h-5 w-5" />
          Students
        </Link>
      </li>
      <li>
        <Link
          href="/attendance"
          className="text-base-content dark:text-white"
          onClick={closeDrawer}
        >
          <CalendarIcon className="h-5 w-5" />
          Attendance
        </Link>
      </li>
      <li>
        <Link
          href="/tests"
          className="text-base-content dark:text-white"
          onClick={closeDrawer}
        >
          <ClipboardDocumentCheckIcon className="h-5 w-5" />
          Tests
        </Link>
      </li>

      {/* Admin Section - Only show if user has permissions */}
      {!loading && (canManageUsers || canManageClasses) && (
        <>
          <li className="menu-title mt-4">Administration</li>
          {canManageClasses && (
            <li>
              <Link
                href="/admin/classes"
                className="text-base-content dark:text-white"
                onClick={closeDrawer}
              >
                <AcademicCapIcon className="h-5 w-5" />
                Classes
              </Link>
            </li>
          )}
          {canManageUsers && (
            <li>
              <Link
                href="/admin/users"
                className="text-base-content dark:text-white"
                onClick={closeDrawer}
              >
                <UsersIcon className="h-5 w-5" />
                Users
              </Link>
            </li>
          )}
        </>
      )}

      <li className="menu-title mt-4">Quick Actions</li>
      <li>
        <Link
          href="/attendance/take-roll"
          className="btn btn-primary"
          onClick={closeDrawer}
        >
          Take Roll
        </Link>
      </li>
      <li className="mt-3">
        <Link
          href="/students/add"
          className="btn btn-secondary"
          onClick={closeDrawer}
        >
          Add Student
        </Link>
      </li>

      <li className="menu-title mt-4">Account</li>
      <li>
        <SignOutButton />
      </li>
    </ul>
  );
}
