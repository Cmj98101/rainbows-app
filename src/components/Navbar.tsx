import Link from "next/link";

export function Navbar() {
  return (
    <div className="navbar bg-base-100 shadow-lg">
      <div className="flex-1">
        <Link href="/" className="btn btn-ghost text-xl">
          Rainbows Dashboard
        </Link>
      </div>
      <div className="flex-none">
        <ul className="menu menu-horizontal px-1">
          <li>
            <Link href="/">Dashboard</Link>
          </li>
          <li>
            <Link href="/students">Students</Link>
          </li>
          <li>
            <Link href="/attendance">Attendance</Link>
          </li>
          <li>
            <Link href="/tests">Tests</Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
