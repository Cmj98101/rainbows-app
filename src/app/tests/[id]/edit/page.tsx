"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";

export default function EditTestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: testId } = use(params);
  const router = useRouter();
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchTest = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/tests/${testId}`);
        if (!res.ok) throw new Error("Failed to fetch test");
        const test = await res.json();
        setName(test.name);
        setDate(
          test.date ? new Date(test.date).toISOString().split("T")[0] : ""
        );
      } catch (err) {
        setError("Failed to load test");
      } finally {
        setLoading(false);
      }
    };
    if (testId) fetchTest();
  }, [testId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/tests/${testId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, date }),
      });
      if (!res.ok) throw new Error("Failed to update test");
      setSuccess("Test updated!");
      router.refresh();
    } catch (err) {
      setError("Failed to update test");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this test? This cannot be undone."
      )
    )
      return;
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/tests/${testId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete test");
      router.push("/tests");
      router.refresh();
    } catch (err) {
      setError("Failed to delete test");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Edit Test</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Test Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input input-bordered w-full"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input input-bordered w-full"
            required
          />
        </div>
        {error && <div className="text-red-600">{error}</div>}
        {success && <div className="text-green-600">{success}</div>}
        <div className="flex gap-4">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            className="btn btn-error"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete Test"}
          </button>
        </div>
      </form>
    </div>
  );
}
