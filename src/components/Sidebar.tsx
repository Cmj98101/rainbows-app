"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  HomeIcon,
  UserGroupIcon,
  CalendarIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/auth/signin" })}
      className="text-red-600 hover:text-red-700"
    >
      <ArrowRightOnRectangleIcon className="h-5 w-5" />
      Sign Out
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
      {/* <li>
        <Link href="/reports">
          <ChartBarIcon className="h-5 w-5" />
          Reports
        </Link>
      </li> */}

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
