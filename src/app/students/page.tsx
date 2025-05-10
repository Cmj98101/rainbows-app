import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { EyeIcon, PencilIcon } from "@heroicons/react/24/outline";
import DeleteStudentIcon from "@/components/DeleteStudentIcon";
import { Student } from "@/types/student";
import connectDB from "@/lib/db";
import StudentModel from "@/models/Student";

async function getStudents() {
  try {
    await connectDB();
    const students = await StudentModel.find({}).lean();
    return students as unknown as Student[];
  } catch (error) {
    console.error("Error fetching students:", error);
    throw new Error("Failed to fetch students");
  }
}

export default async function StudentsPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/signin");
  }

  const students = await getStudents();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Students</h1>
        <Link
          href="/students/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          Add Student
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
                Guardian
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.map((student) => {
              const primaryGuardian = student.guardians[0];
              return (
                <tr key={student._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {`${student.firstName} ${student.lastName}`}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {primaryGuardian
                        ? `${primaryGuardian.name} (${primaryGuardian.relationship})`
                        : "No guardian"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {primaryGuardian?.phone || "No phone"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/students/${student._id}`}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      View
                    </Link>
                    <Link
                      href={`/students/${student._id}/edit`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
