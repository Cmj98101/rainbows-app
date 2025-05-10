"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import {
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

export function Sidebar() {
  return (
    <ul className="menu p-4 w-80 min-h-full bg-base-200 text-base-content">
      <li className="menu-title">Navigation</li>
      <li>
        <Link href="/students">
          <UserGroupIcon className="h-5 w-5" />
          Students
        </Link>
      </li>
      <li>
        <Link href="/attendance">
          <CalendarIcon className="h-5 w-5" />
          Attendance
        </Link>
      </li>
      <li>
        <Link href="/tests">
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
        <Link href="/attendance/take-roll" className="btn btn-primary">
          Take Roll
        </Link>
      </li>
      <li className="mt-3">
        <Link href="/students/add" className="btn btn-secondary">
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
