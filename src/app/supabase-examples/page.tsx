/**
 * Example Page: Using Supabase in Client Components
 *
 * This demonstrates how to fetch and display data from Supabase
 * in a Next.js client component with proper TypeScript types.
 */

'use client';

import { useState, useEffect } from 'react';
import { supabaseClient } from '@/lib/supabase';
import type { Student, Guardian } from '@/types/supabase';

interface StudentWithGuardians extends Student {
  guardians?: Guardian[];
}

export default function SupabaseExamplesPage() {
  const [students, setStudents] = useState<StudentWithGuardians[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch students on component mount
  useEffect(() => {
    fetchStudents();
  }, []);

  /**
   * Fetch all students with their guardians
   */
  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabaseClient
        .from('students')
        .select(`
          *,
          guardians (
            id,
            name,
            relationship,
            phone,
            email,
            is_emergency_contact
          )
        `)
        .order('last_name', { ascending: true });

      if (error) throw error;

      setStudents(data || []);
    } catch (err: any) {
      console.error('Error fetching students:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Add a new student
   */
  const addStudent = async () => {
    try {
      const { data, error } = await supabaseClient
        .from('students')
        .insert({
          church_id: 'your-church-id', // Get from auth session
          first_name: 'John',
          last_name: 'Doe',
          birthday: '2010-01-01',
          gender: 'Male',
        })
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      setStudents([...students, data]);
      alert('Student added successfully!');
    } catch (err: any) {
      console.error('Error adding student:', err);
      alert(`Error: ${err.message}`);
    }
  };

  /**
   * Delete a student
   */
  const deleteStudent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return;

    try {
      const { error } = await supabaseClient
        .from('students')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Remove from local state
      setStudents(students.filter(s => s.id !== id));
      alert('Student deleted successfully!');
    } catch (err: any) {
      console.error('Error deleting student:', err);
      alert(`Error: ${err.message}`);
    }
  };

  /**
   * Real-time subscription example
   */
  useEffect(() => {
    // Subscribe to real-time changes
    const channel = supabaseClient
      .channel('students-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'students',
        },
        (payload) => {
          console.log('Real-time update:', payload);
          // Refetch students when changes occur
          fetchStudents();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, []);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Supabase Examples</h1>

      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">ℹ️ About This Page</h2>
        <p className="text-sm text-gray-700">
          This page demonstrates how to use Supabase in a client component.
          It shows fetching, inserting, deleting, and real-time subscriptions.
        </p>
        <p className="text-sm text-gray-700 mt-2">
          <strong>Note:</strong> This will only work after you've set up your
          Supabase project and run the migrations!
        </p>
      </div>

      {/* Actions */}
      <div className="mb-6 flex gap-4">
        <button
          onClick={fetchStudents}
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh Students'}
        </button>
        <button
          onClick={addStudent}
          className="btn btn-secondary"
        >
          Add Test Student
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="alert alert-error mb-6">
          <span>Error: {error}</span>
        </div>
      )}

      {/* Students List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">
            Students ({students.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="loading loading-spinner loading-lg"></div>
          </div>
        ) : students.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No students found. Add one to get started!
          </div>
        ) : (
          <div className="divide-y">
            {students.map((student) => (
              <div key={student.id} className="p-6 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {student.first_name} {student.last_name}
                    </h3>
                    {student.birthday && (
                      <p className="text-sm text-gray-600">
                        Birthday: {new Date(student.birthday).toLocaleDateString()}
                      </p>
                    )}
                    {student.gender && (
                      <p className="text-sm text-gray-600">
                        Gender: {student.gender}
                      </p>
                    )}

                    {/* Guardians */}
                    {student.guardians && student.guardians.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">
                          Guardians:
                        </h4>
                        <ul className="space-y-1">
                          {student.guardians.map((guardian) => (
                            <li key={guardian.id} className="text-sm text-gray-600">
                              {guardian.name}
                              {guardian.relationship && ` (${guardian.relationship})`}
                              {guardian.phone && ` - ${guardian.phone}`}
                              {guardian.is_emergency_contact && (
                                <span className="ml-2 badge badge-sm badge-warning">
                                  Emergency
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => deleteStudent(student.id)}
                    className="btn btn-error btn-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Code Examples */}
      <div className="mt-8 p-6 bg-gray-900 text-gray-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-white">Code Examples</h2>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2 text-green-400">Fetch with Join</h3>
            <pre className="text-sm overflow-x-auto">
{`const { data, error } = await supabaseClient
  .from('students')
  .select(\`
    *,
    guardians (*),
    class:classes (*)
  \`)
  .order('last_name', { ascending: true });`}
            </pre>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2 text-green-400">Insert</h3>
            <pre className="text-sm overflow-x-auto">
{`const { data, error } = await supabaseClient
  .from('students')
  .insert({
    church_id: 'uuid',
    first_name: 'John',
    last_name: 'Doe'
  })
  .select()
  .single();`}
            </pre>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2 text-green-400">Update</h3>
            <pre className="text-sm overflow-x-auto">
{`const { data, error } = await supabaseClient
  .from('students')
  .update({ first_name: 'Jane' })
  .eq('id', studentId)
  .select()
  .single();`}
            </pre>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2 text-green-400">Real-time Subscription</h3>
            <pre className="text-sm overflow-x-auto">
{`const channel = supabaseClient
  .channel('students-changes')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'students' },
    (payload) => console.log(payload)
  )
  .subscribe();`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
