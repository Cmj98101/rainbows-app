"use client";

import { TrashIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

interface DeleteStudentIconProps {
  studentId: string;
  studentName: string;
}

export default function DeleteStudentIcon({
  studentId,
  studentName,
}: DeleteStudentIconProps) {
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

      router.refresh();
    } catch (error) {
      console.error("Error deleting student:", error);
      alert("Failed to delete student. Please try again.");
    }
  };

  return (
    <button
      onClick={handleDelete}
      className="btn btn-ghost btn-sm text-error hover:text-error hover:bg-error/10"
      title="Delete student"
    >
      <TrashIcon className="h-4 w-4" />
    </button>
  );
}
