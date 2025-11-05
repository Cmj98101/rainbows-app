/**
 * Example API Route: Students with Supabase
 *
 * This file demonstrates how to use Supabase instead of MongoDB
 * for CRUD operations with proper multi-tenant isolation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

type Student = Database['public']['Tables']['students']['Row'];
type StudentInsert = Database['public']['Tables']['students']['Insert'];

// Helper function to get user from session
// TODO: Replace with actual Supabase Auth session
async function getCurrentUser(request: NextRequest) {
  // This is a placeholder - will be replaced with Supabase Auth
  // For now, returning a mock user
  return {
    id: 'user-uuid-here',
    church_id: 'church-uuid-here',
    role: 'teacher' as const,
  };
}

/**
 * GET /api/supabase-examples/students
 * Fetch all students with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    const { searchParams } = new URL(request.url);

    const classId = searchParams.get('classId');
    const sortBy = searchParams.get('sortBy') || 'last_name';

    // Build query
    let query = supabaseAdmin
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
      .eq('church_id', user.church_id); // Multi-tenant filter

    // Apply optional filters
    if (classId) {
      query = query.eq('class_id', classId);
    }

    // Apply sorting
    if (sortBy === 'first_name') {
      query = query.order('first_name', { ascending: true });
    } else {
      query = query.order('last_name', { ascending: true });
    }

    const { data: students, error } = await query;

    if (error) {
      console.error('Error fetching students:', error);
      return NextResponse.json(
        { error: 'Failed to fetch students' },
        { status: 500 }
      );
    }

    return NextResponse.json(students);

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/supabase-examples/students
 * Create a new student with guardians
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    const body = await request.json();

    const {
      first_name,
      last_name,
      birthday,
      gender,
      email,
      phone,
      address,
      class_id,
      guardians,
    } = body;

    // Validate required fields
    if (!first_name || !last_name) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400 }
      );
    }

    // Insert student
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .insert({
        church_id: user.church_id, // Automatic multi-tenant isolation
        class_id: class_id || null,
        first_name,
        last_name,
        birthday: birthday || null,
        gender: gender || null,
        email: email || null,
        phone: phone || null,
        address: address || {},
      })
      .select()
      .single();

    if (studentError) {
      console.error('Error creating student:', studentError);
      return NextResponse.json(
        { error: 'Failed to create student' },
        { status: 500 }
      );
    }

    // Insert guardians if provided
    if (guardians && guardians.length > 0) {
      const guardianInserts = guardians.map((guardian: any) => ({
        student_id: student.id,
        name: guardian.name,
        relationship: guardian.relationship || null,
        phone: guardian.phone || null,
        email: guardian.email || null,
        address: guardian.address || {},
        is_emergency_contact: guardian.is_emergency_contact || false,
      }));

      const { error: guardianError } = await supabaseAdmin
        .from('guardians')
        .insert(guardianInserts);

      if (guardianError) {
        console.error('Error creating guardians:', guardianError);
        // Student was created but guardians failed
        // You might want to handle this differently
      }
    }

    // Fetch the complete student with guardians
    const { data: completeStudent } = await supabaseAdmin
      .from('students')
      .select(`
        *,
        guardians (*)
      `)
      .eq('id', student.id)
      .single();

    return NextResponse.json(completeStudent, { status: 201 });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/supabase-examples/students
 * Update an existing student
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    // Verify student belongs to user's church (multi-tenant security)
    const { data: existingStudent } = await supabaseAdmin
      .from('students')
      .select('id, church_id')
      .eq('id', id)
      .eq('church_id', user.church_id)
      .single();

    if (!existingStudent) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Update student
    const { data: student, error } = await supabaseAdmin
      .from('students')
      .update(updates)
      .eq('id', id)
      .eq('church_id', user.church_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating student:', error);
      return NextResponse.json(
        { error: 'Failed to update student' },
        { status: 500 }
      );
    }

    return NextResponse.json(student);

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/supabase-examples/students
 * Delete a student (cascades to guardians, attendance, test results)
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    // Verify student belongs to user's church
    const { data: existingStudent } = await supabaseAdmin
      .from('students')
      .select('id, church_id')
      .eq('id', id)
      .eq('church_id', user.church_id)
      .single();

    if (!existingStudent) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Delete student (cascades automatically to related tables)
    const { error } = await supabaseAdmin
      .from('students')
      .delete()
      .eq('id', id)
      .eq('church_id', user.church_id);

    if (error) {
      console.error('Error deleting student:', error);
      return NextResponse.json(
        { error: 'Failed to delete student' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Student deleted successfully' });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
