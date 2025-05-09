"use client";

import Link from "next/link";
import TestActions from "@/components/TestActions";

export default function TestListClient({
  tests,
}: {
  tests: { _id: string; name: string; date: string }[];
}) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <table className="table w-full">
        <thead>
          <tr>
            <th>Name</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tests.map((test) => (
            <tr key={test._id}>
              <td>{test.name}</td>
              <td>{new Date(test.date).toLocaleDateString()}</td>
              <td className="flex gap-2">
                <Link
                  href={`/tests/${test._id}/results`}
                  className="btn btn-sm btn-secondary"
                >
                  Record Results
                </Link>
                <TestActions testId={test._id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
