"use client";

import { TrashIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

interface DeleteStudentButtonProps {
  studentId: string;
  studentName: string;
}

export default function DeleteStudentButton({
  studentId,
  studentName,
}: DeleteStudentButtonProps) {
  const router = useRouter();

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete ${studentName}? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete student");
      }

      router.push("/students");
      router.refresh();
    } catch (error) {
      console.error("Error deleting student:", error);
      alert("Failed to delete student. Please try again.");
    }
  };

  return (
    <button onClick={handleDelete} className="btn btn-error">
      <TrashIcon className="h-5 w-5 mr-2" />
      Delete Student
    </button>
  );
}
