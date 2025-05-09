"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  testResults: { testId: string; status: string }[];
}

interface Test {
  _id: string;
  name: string;
  date: string;
}

const STATUS_OPTIONS = [
  { value: "passed", label: "Passed", className: "btn-success" },
  { value: "failed", label: "Failed", className: "btn-error" },
  {
    value: "absent",
    label: "Absent",
    className: "bg-orange-400 text-white border-0",
  },
];

export default function TestResultsPage() {
  const params = useParams();
  const router = useRouter();
  const testId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [test, setTest] = useState<Test | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [results, setResults] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const testRes = await fetch(`/api/tests/${testId}`);
        if (!testRes.ok) throw new Error("Failed to fetch test");
        const testData = await testRes.json();
        setTest(testData);
        const studentsRes = await fetch(`/api/students`);
        if (!studentsRes.ok) throw new Error("Failed to fetch students");
        const studentsData: Student[] = await studentsRes.json();
        setStudents(studentsData);
        // Pre-fill results if already recorded
        const initialResults: Record<string, string> = {};
        studentsData.forEach((student) => {
          const result = student.testResults.find((r) => r.testId === testId);
          initialResults[student._id] = result ? result.status : "absent";
        });
        setResults(initialResults);
      } catch (err) {
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    if (testId) fetchData();
  }, [testId]);

  const handleResultChange = (studentId: string, status: string) => {
    setResults((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/tests/${testId}/results`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ results }),
      });
      if (!res.ok) throw new Error("Failed to save results");
      setSuccess("Results saved!");
      router.refresh();
    } catch (err) {
      setError("Failed to save results");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!test) return <div className="p-4">Test not found</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">
        Record Results: {test.name} ({new Date(test.date).toLocaleDateString()})
      </h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th colSpan={3}>Result</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student._id}>
                  <td>
                    {student.firstName} {student.lastName}
                  </td>
                  <td colSpan={3}>
                    <div className="btn-group">
                      {STATUS_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          className={`btn btn-sm ${
                            results[student._id] === opt.value
                              ? opt.className
                              : "btn-outline"
                          }`}
                          onClick={() =>
                            handleResultChange(student._id, opt.value)
                          }
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {error && <div className="text-red-600">{error}</div>}
        {success && <div className="text-green-600">{success}</div>}
        <div className="flex justify-end">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Save Results"}
          </button>
        </div>
      </form>
    </div>
  );
}
