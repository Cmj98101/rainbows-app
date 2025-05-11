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
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Students</h1>
        <Link href="/students/add" className="btn btn-primary">
          Add Student
        </Link>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>Guardian</th>
                <th>Phone</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const primaryGuardian = student.guardians[0];
                return (
                  <tr key={student._id}>
                    <td className="font-medium">
                      {`${student.firstName} ${student.lastName}`}
                    </td>
                    <td>
                      {primaryGuardian
                        ? `${primaryGuardian.name} (${primaryGuardian.relationship})`
                        : "No guardian"}
                    </td>
                    <td>{primaryGuardian?.phone || "No phone"}</td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/students/${student._id}`}
                          className="btn btn-ghost btn-sm"
                        >
                          View
                        </Link>
                        <Link
                          href={`/students/${student._id}/edit`}
                          className="btn btn-ghost btn-sm"
                        >
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
