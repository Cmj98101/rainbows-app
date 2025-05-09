import Link from "next/link";
import {
  UserGroupIcon,
  CalendarIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

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
      <li>
        <Link href="/reports">
          <ChartBarIcon className="h-5 w-5" />
          Reports
        </Link>
      </li>

      <li className="menu-title mt-4">Quick Actions</li>
      <li>
        <Link href="/attendance/take-roll" className="btn btn-primary">
          Take Roll
        </Link>
      </li>
      <li>
        <Link href="/students/add" className="btn btn-secondary">
          Add Student
        </Link>
      </li>
    </ul>
  );
}
