import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import Test from "@/models/Test";

interface Test {
  _id: string;
  name: string;
  date: string;
  passRate: number;
}

async function getTests() {
  try {
    await connectDB();
    const tests = await Test.find({}).sort({ date: -1 }).lean();
    return tests as unknown as Test[];
  } catch (error) {
    console.error("Error fetching tests:", error);
    throw new Error("Failed to fetch tests");
  }
}

export default async function TestsPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/signin");
  }

  const tests = await getTests();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Tests</h1>
        <Link href="/tests/add" className="btn btn-primary">
          Add Test
        </Link>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>Date</th>
                <th>Pass Rate</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tests.map((test) => (
                <tr key={test._id}>
                  <td className="font-medium">{test.name}</td>
                  <td>{new Date(test.date).toLocaleDateString()}</td>
                  <td>{test.passRate}%</td>
                  <td className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/tests/${test._id}/results`}
                        className="btn btn-ghost btn-sm"
                      >
                        View
                      </Link>
                      <Link
                        href={`/tests/${test._id}/edit`}
                        className="btn btn-ghost btn-sm"
                      >
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
