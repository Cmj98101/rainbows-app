"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Class {
  id: string;
  name: string;
}

export default function AddTestPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [classId, setClassId] = useState("");
  const [description, setDescription] = useState("");
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingClasses, setFetchingClasses] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    // Fetch available classes
    const fetchClasses = async () => {
      try {
        const res = await fetch("/api/classes");
        if (res.ok) {
          const data = await res.json();
          setClasses(data);
          // Auto-select first class if available
          if (data.length > 0) {
            setClassId(data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch classes:", err);
      } finally {
        setFetchingClasses(false);
      }
    };
    fetchClasses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!classId) {
      setError("Please select a class");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, date, classId, description }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to add test");
      }

      setSuccess("Test added!");
      setName("");
      setDate("");
      setDescription("");
      router.push("/tests");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add test");
    } finally {
      setLoading(false);
    }
  };

  // Show loading skeleton while fetching classes
  if (fetchingClasses) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-48 mb-6"></div>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body space-y-4 animate-pulse">
            <div className="form-control">
              <div className="h-4 bg-gray-300 rounded w-16 mb-2"></div>
              <div className="h-12 bg-gray-300 rounded"></div>
            </div>
            <div className="form-control">
              <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
              <div className="h-12 bg-gray-300 rounded"></div>
            </div>
            <div className="form-control">
              <div className="h-4 bg-gray-300 rounded w-16 mb-2"></div>
              <div className="h-12 bg-gray-300 rounded"></div>
            </div>
            <div className="form-control">
              <div className="h-4 bg-gray-300 rounded w-32 mb-2"></div>
              <div className="h-24 bg-gray-300 rounded"></div>
            </div>
            <div className="card-actions justify-end">
              <div className="h-12 bg-gray-300 rounded w-20"></div>
              <div className="h-12 bg-gray-300 rounded w-24"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Add New Test</h1>

      {classes.length === 0 && (
        <div className="alert alert-warning mb-6">
          <span>No classes available. Please create a class first before adding tests.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card bg-base-100 shadow-xl">
        <div className="card-body space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Class *</span>
            </label>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="select select-bordered"
              required
            >
              <option value="">Select a class...</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Test Name *</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input input-bordered"
              placeholder="e.g., Unit 1 Quiz, Memory Verse Test"
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Date *</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input input-bordered"
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Description (optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="textarea textarea-bordered"
              placeholder="Optional notes about this test"
              rows={3}
            />
          </div>

          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="alert alert-success">
              <span>{success}</span>
            </div>
          )}

          <div className="card-actions justify-end">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || classes.length === 0}
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Adding...
                </>
              ) : (
                "Add Test"
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
