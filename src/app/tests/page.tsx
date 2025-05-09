import Link from "next/link";
import TestListClient from "@/components/TestListClient";

async function getTests() {
  const res = await fetch(`/api/tests`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch tests");
  return res.json();
}

export default async function TestsPage() {
  const tests = await getTests();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tests</h1>
        <Link href="/tests/add" className="btn btn-primary">
          Add Test
        </Link>
      </div>
      <TestListClient tests={tests} />
    </div>
  );
}
