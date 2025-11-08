"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { use } from "react";
import { PencilIcon } from "@heroicons/react/24/outline";
import DeleteStudentButton from "@/components/DeleteStudentButton";

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  birthday: string;
  gender: string;
  email?: string;
  phone?: string;
  address?: string;
  guardians: Array<{
    name: string;
    relationship: string;
    phone: string;
    email?: string;
    address?: string;
    isEmergencyContact: boolean;
  }>;
  notes?: string;
}

export default function ViewStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const response = await fetch(`/api/students/${id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch student");
        }
        const data = await response.json();
        console.log("Fetched student data in view page:", data);
        console.log("Guardians data:", data.guardians);
        setStudent(data);
      } catch (err) {
        setError("Failed to load student data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!student) return <div>Student not found</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {student.firstName} {student.lastName}
        </h1>
        <div className="flex gap-2">
          <Link
            href={`/students/${id}/edit`}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center"
          >
            <PencilIcon className="h-5 w-5 mr-2" />
            Edit
          </Link>
          <DeleteStudentButton
            studentId={id}
            studentName={`${student.firstName} ${student.lastName}`}
          />
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">First Name</p>
              <p className="mt-1">{student.firstName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Last Name</p>
              <p className="mt-1">{student.lastName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Birthday</p>
              <p className="mt-1">
                {new Date(student.birthday).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Gender</p>
              <p className="mt-1">{student.gender}</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Guardian Information</h2>
          {student.guardians && student.guardians.length > 0 ? (
            <div className="space-y-4">
              {student.guardians.map((guardian, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{guardian.name}</p>
                      <p className="text-sm text-gray-500">
                        {guardian.relationship}
                      </p>
                    </div>
                    {guardian.isEmergencyContact && (
                      <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        Emergency Contact
                      </span>
                    )}
                  </div>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Phone</p>
                      <p className="mt-1">{guardian.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p className="mt-1">{guardian.email || "Not provided"}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-gray-500">
                        Address
                      </p>
                      <p className="mt-1">
                        {guardian.address
                          ? (typeof guardian.address === 'string'
                              ? guardian.address
                              : JSON.stringify(guardian.address))
                          : "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No guardian information provided</p>
          )}
        </div>

        {student.notes && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Additional Notes</h2>
            <p className="whitespace-pre-wrap">{student.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
