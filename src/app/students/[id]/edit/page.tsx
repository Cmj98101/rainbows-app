"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { use } from "react";

interface Guardian {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  address?: string;
  isEmergencyContact: boolean;
}

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  birthday: string;
  gender: string;
  email?: string;
  phone?: string;
  address?: string;
  guardians: Guardian[];
  notes?: string;
}

function formatPhoneNumber(value: string) {
  // Remove all non-digit characters
  const cleaned = value.replace(/\D/g, "");
  const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
  if (!match) return value;
  let formatted = "";
  if (match[1]) formatted = `(${match[1]}`;
  if (match[2]) formatted += match[2].length === 3 ? `) ${match[2]}` : match[2];
  if (match[3]) formatted += `-${match[3]}`;
  return formatted;
}

export default function EditStudentPage({
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
        console.log("Fetched student data in edit page:", data); // Debug log
        console.log("Guardians data:", data.guardians); // Debug log
        setStudent({
          ...data,
          birthday: data.birthday
            ? new Date(data.birthday).toISOString().split("T")[0]
            : "",
          guardians: data.guardians || [],
        });
      } catch (err) {
        setError("Failed to load student data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;

    try {
      const submitData = {
        ...student,
        guardians: student.guardians.map((guardian) => ({
          name: guardian.name.trim(),
          relationship: guardian.relationship.trim(),
          phone: guardian.phone.trim(),
          email: guardian.email?.trim() || "",
          address: guardian.address?.trim() || "",
          isEmergencyContact: guardian.isEmergencyContact,
        })),
      };

      console.log("Submitting data in edit page:", submitData); // Debug log
      console.log("Guardians data being submitted:", submitData.guardians); // Debug log

      const response = await fetch(`/api/students/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update student");
      }

      const updatedStudent = await response.json();
      console.log("Updated student data in edit page:", updatedStudent); // Debug log
      console.log("Updated guardians data:", updatedStudent.guardians); // Debug log
      setStudent({
        ...updatedStudent,
        guardians: updatedStudent.guardians || [],
      });
      router.refresh();
      router.push(`/students/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update student");
      console.error(err);
    }
  };

  const handleGuardianChange = (
    index: number,
    field: keyof Guardian,
    value: string | boolean
  ) => {
    if (!student) return;
    const updatedGuardians = [...student.guardians];
    updatedGuardians[index] = {
      ...updatedGuardians[index],
      [field]:
        field === "phone" && typeof value === "string"
          ? formatPhoneNumber(value)
          : value,
    };
    setStudent({
      ...student,
      guardians: updatedGuardians,
    });
  };

  const addGuardian = () => {
    if (!student) return;
    setStudent({
      ...student,
      guardians: [
        ...student.guardians,
        {
          name: "",
          relationship: "",
          phone: "",
          email: "",
          address: "",
          isEmergencyContact: false,
        },
      ],
    });
  };

  const removeGuardian = (index: number) => {
    if (!student) return;
    const updatedGuardians = [...student.guardians];
    updatedGuardians.splice(index, 1);
    setStudent({
      ...student,
      guardians: updatedGuardians,
    });
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!student) return <div>Student not found</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Edit Student</h1>
        <Link
          href={`/students/${id}`}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Cancel
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                First Name
              </label>
              <input
                type="text"
                value={student.firstName}
                onChange={(e) =>
                  setStudent({ ...student, firstName: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Last Name
              </label>
              <input
                type="text"
                value={student.lastName}
                onChange={(e) =>
                  setStudent({ ...student, lastName: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Date of Birth</span>
              </label>
              <input
                type="date"
                value={student.birthday}
                onChange={(e) =>
                  setStudent({ ...student, birthday: e.target.value })
                }
                className="input input-bordered"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Gender
              </label>
              <select
                value={student.gender}
                onChange={(e) =>
                  setStudent({ ...student, gender: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Guardian Information</h2>
          <div className="flex justify-between items-center mb-4">
            <button
              type="button"
              onClick={addGuardian}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Add Guardian
            </button>
          </div>
          {student.guardians.map((guardian, index) => (
            <div key={index} className="border rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Guardian {index + 1}</h3>
                <button
                  type="button"
                  onClick={() => removeGuardian(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    value={guardian.name}
                    onChange={(e) =>
                      handleGuardianChange(index, "name", e.target.value)
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Relationship
                  </label>
                  <select
                    value={guardian.relationship}
                    onChange={(e) =>
                      handleGuardianChange(
                        index,
                        "relationship",
                        e.target.value
                      )
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select relationship</option>
                    <option value="mother">Mother</option>
                    <option value="father">Father</option>
                    <option value="father">Brother</option>
                    <option value="father">Sister</option>
                    <option value="guardian">Guardian</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={guardian.phone}
                    onChange={(e) =>
                      handleGuardianChange(index, "phone", e.target.value)
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    value={guardian.email || ""}
                    onChange={(e) =>
                      handleGuardianChange(index, "email", e.target.value)
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <input
                    type="text"
                    value={guardian.address || ""}
                    onChange={(e) =>
                      handleGuardianChange(index, "address", e.target.value)
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={guardian.isEmergencyContact}
                      onChange={(e) =>
                        handleGuardianChange(
                          index,
                          "isEmergencyContact",
                          e.target.checked
                        )
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Emergency Contact
                    </span>
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Additional Notes</h2>
          <textarea
            value={student.notes || ""}
            onChange={(e) => setStudent({ ...student, notes: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows={4}
          />
        </div>

        <div className="flex justify-end space-x-4">
          <Link
            href={`/students/${id}`}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
