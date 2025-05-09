"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";

export default function TestActions({ testId }: { testId: string }) {
  const router = useRouter();

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this test? This cannot be undone."
      )
    )
      return;
    await fetch(`/api/tests/${testId}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <div className="flex gap-2 items-center">
      <Link
        href={`/tests/${testId}/edit`}
        aria-label="Edit Test"
        className="btn btn-ghost btn-sm"
        title="Edit Test"
      >
        <PencilIcon className="h-4 w-4" />
      </Link>
      <button
        onClick={handleDelete}
        aria-label="Delete Test"
        className="btn btn-ghost btn-sm text-error hover:text-error hover:bg-error/10"
        title="Delete Test"
        type="button"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
