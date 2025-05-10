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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Tests</h1>
        <Link
          href="/tests/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          Add Test
        </Link>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pass Rate
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tests.map((test) => (
              <tr key={test._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {test.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {new Date(test.date).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{test.passRate}%</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link
                    href={`/tests/${test._id}`}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    View
                  </Link>
                  <Link
                    href={`/tests/${test._id}/edit`}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
