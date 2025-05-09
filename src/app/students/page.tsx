import Link from "next/link";
import { EyeIcon, PencilIcon } from "@heroicons/react/24/outline";
import DeleteStudentIcon from "@/components/DeleteStudentIcon";

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  parentName: string;
  parentRelationship: string;
  email: string;
  phone: string;
}

async function getStudents() {
  const res = await fetch(`/api/students`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch students");
  return res.json() as Promise<Student[]>;
}

export default async function StudentsPage() {
  const students = await getStudents();

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Students</h1>
        <Link href="/students/add" className="btn btn-primary">
          Add New Student
        </Link>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Parent/Guardian</th>
                  <th>Contact</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student._id}>
                    <td>
                      {student.firstName} {student.lastName}
                    </td>
                    <td>
                      {student.parentName}
                      <br />
                      <span className="text-sm text-gray-500">
                        {student.parentRelationship}
                      </span>
                    </td>
                    <td>
                      {student.email}
                      <br />
                      {student.phone}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <Link
                          href={`/students/${student._id}`}
                          className="btn btn-ghost btn-sm"
                          title="View Details"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/students/${student._id}/edit`}
                          className="btn btn-ghost btn-sm"
                          title="Edit Student"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Link>
                        <DeleteStudentIcon
                          studentId={student._id.toString()}
                          studentName={`${student.firstName} ${student.lastName}`}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
