"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Guardian {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  address?: string;
  isEmergencyContact: boolean;
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

interface Class {
  id: string;
  name: string;
  age_group?: string;
}

export default function AddStudentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [error, setError] = useState("");
  const [classes, setClasses] = useState<Class[]>([]);
  const [student, setStudent] = useState({
    firstName: "",
    lastName: "",
    birthday: "",
    gender: "",
    classId: "",
    guardians: [
      {
        name: "",
        relationship: "",
        phone: "",
        email: "",
        address: "",
        isEmergencyContact: true,
      },
    ],
    notes: "",
  });

  useEffect(() => {
    // Fetch available classes
    setLoadingClasses(true);
    fetch("/api/classes")
      .then((res) => res.json())
      .then((data) => {
        setClasses(data);
        // Auto-select first class if available
        if (data.length > 0) {
          setStudent(prev => ({ ...prev, classId: data[0].id }));
        }
      })
      .catch((error) => console.error("Failed to fetch classes:", error))
      .finally(() => setLoadingClasses(false));
  }, []);

  const addGuardian = () => {
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
    setStudent({
      ...student,
      guardians: student.guardians.filter((_, i) => i !== index),
    });
  };

  const updateGuardian = (
    index: number,
    field: keyof Guardian,
    value: string | boolean
  ) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validate class is selected
      if (!student.classId) {
        throw new Error("Please select a class for the student");
      }

      // Validate required guardian fields
      const validGuardians = student.guardians.filter(
        (guardian) => guardian.name && guardian.relationship && guardian.phone
      );

      if (validGuardians.length === 0) {
        throw new Error(
          "At least one guardian with name, relationship, and phone is required"
        );
      }

      const submitData = {
        ...student,
        guardians: validGuardians.map((guardian) => ({
          name: guardian.name.trim(),
          relationship: guardian.relationship.trim(),
          phone: guardian.phone.trim(),
          email: guardian.email?.trim() || "",
          address: guardian.address?.trim() || "",
          isEmergencyContact: guardian.isEmergencyContact,
        })),
      };

      console.log("Submitting student data:", submitData); // Debug log

      const response = await fetch("/api/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create student");
      }

      router.push("/students");
      router.refresh();
    } catch (err) {
      console.error("Error creating student:", err);
      setError(err instanceof Error ? err.message : "Failed to create student");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Add New Student</h1>

      {!loadingClasses && classes.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-6">
          <p className="font-medium">No classes available</p>
          <p className="text-sm">Please create at least one class before adding students. All students must be assigned to a class.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
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
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Date of Birth
              </label>
              <input
                type="date"
                value={student.birthday}
                onChange={(e) =>
                  setStudent({ ...student, birthday: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                required
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Class *
              </label>
              <select
                value={student.classId}
                onChange={(e) =>
                  setStudent({ ...student, classId: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
                disabled={loadingClasses}
              >
                {loadingClasses ? (
                  <option value="">Loading classes...</option>
                ) : classes.length === 0 ? (
                  <option value="">No classes available</option>
                ) : (
                  <>
                    <option value="">Select a class...</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                        {cls.age_group ? ` (${cls.age_group})` : ""}
                      </option>
                    ))}
                  </>
                )}
              </select>
              {!loadingClasses && classes.length === 0 && (
                <p className="mt-1 text-sm text-red-600">
                  No classes available. Please create a class before adding students.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Guardian Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Guardian Information</h2>
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
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => removeGuardian(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                )}
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
                      updateGuardian(index, "name", e.target.value)
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
                      updateGuardian(index, "relationship", e.target.value)
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
                      updateGuardian(index, "phone", e.target.value)
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
                    value={guardian.email}
                    onChange={(e) =>
                      updateGuardian(index, "email", e.target.value)
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
                    value={guardian.address}
                    onChange={(e) =>
                      updateGuardian(index, "address", e.target.value)
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
                        updateGuardian(
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

        {/* Notes */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Additional Notes</h2>
          <textarea
            value={student.notes}
            onChange={(e) => setStudent({ ...student, notes: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows={4}
            placeholder="Enter any additional notes about the student..."
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={loading || loadingClasses || classes.length === 0}
          >
            {loading ? "Creating..." : loadingClasses ? "Loading..." : classes.length === 0 ? "No Classes Available" : "Create Student"}
          </button>
        </div>
      </form>
    </div>
  );
}
