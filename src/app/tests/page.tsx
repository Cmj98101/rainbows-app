import Link from "next/link";
import TestListClient from "@/components/TestListClient";

async function getTests() {
  const baseUrl =
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : "";

  const res = await fetch(`${baseUrl}/api/tests`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch tests");
  return res.json();
}

export default async function TestsPage() {
  const tests = await getTests();

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tests</h1>
        <Link href="/tests/new" className="btn btn-primary">
          Add New Test
        </Link>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <TestListClient tests={tests} />
        </div>
      </div>
    </div>
  );
}
