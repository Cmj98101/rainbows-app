import { NextResponse } from 'next/server';
import { getClassById, updateClass, deleteClass, assignTeachersToClass } from '@/lib/supabase-helpers';
import { requireAuth, getCurrentChurchId, hasPermission } from '@/lib/auth-helpers';
import { toSnakeCase } from '@/lib/case-converters';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/classes/[id]
 * Get a single class with its teachers
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const churchId = await getCurrentChurchId();

    const classData = await getClassById(id, churchId);

    if (!classData) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      );
    }

    // Format response
    const formatted = {
      _id: classData.id,
      name: classData.name,
      ageGroup: classData.age_group,
      description: classData.description,
      schedule: classData.schedule,
      teachers: classData.teachers?.map((t: any) => ({
        id: t.user.id,
        name: t.user.name,
        email: t.user.email,
        role: t.user.role,
      })) || [],
    };

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching class:', error);
    return NextResponse.json(
      { error: 'Failed to fetch class' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/classes/[id]
 * Update a class and/or its teacher assignments
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const churchId = await getCurrentChurchId();

    // Check permission
    const canManage = await hasPermission('canManageClasses');
    if (!canManage) {
      return NextResponse.json(
        { error: 'You do not have permission to manage classes. Please contact your church administrator to request the "Manage Classes" permission.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { teacherIds, ...classUpdates } = body;

    // Check for duplicate class name (if name is being changed)
    if (classUpdates.name) {
      const { data: existingClass } = await supabaseAdmin
        .from('classes')
        .select('id, name')
        .eq('church_id', churchId)
        .eq('name', classUpdates.name)
        .neq('id', id)
        .single();

      if (existingClass) {
        return NextResponse.json(
          { error: `A class named "${classUpdates.name}" already exists. Please use a different name.` },
          { status: 400 }
        );
      }
    }

    // Update class info if provided
    if (Object.keys(classUpdates).length > 0) {
      const dbUpdates = toSnakeCase(classUpdates);
      await updateClass(id, churchId, dbUpdates);
    }

    // Update teacher assignments if provided
    if (teacherIds !== undefined) {
      await assignTeachersToClass(id, teacherIds);
    }

    // Return updated class
    const updatedClass = await getClassById(id, churchId);

    const formatted = {
      _id: updatedClass.id,
      name: updatedClass.name,
      ageGroup: updatedClass.age_group,
      description: updatedClass.description,
      schedule: updatedClass.schedule,
      teachers: updatedClass.teachers?.map((t: any) => ({
        id: t.user.id,
        name: t.user.name,
        email: t.user.email,
        role: t.user.role,
      })) || [],
    };

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error updating class:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update class' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/classes/[id]
 * Delete a class
 * - Sets all students in this class to unassigned (class_id = NULL)
 * - Deletes all tests associated with this class
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const churchId = await getCurrentChurchId();

    // Check permission
    const canManage = await hasPermission('canManageClasses');
    if (!canManage) {
      return NextResponse.json(
        { error: 'You do not have permission to manage classes. Please contact your church administrator to request the "Manage Classes" permission.' },
        { status: 403 }
      );
    }

    // Get counts for confirmation message
    const { count: studentCount } = await supabaseAdmin
      .from('students')
      .select('id', { count: 'exact' })
      .eq('class_id', id)
      .eq('church_id', churchId);

    const { count: testCount } = await supabaseAdmin
      .from('tests')
      .select('id', { count: 'exact' })
      .eq('class_id', id)
      .eq('church_id', churchId);

    // Unassign all students (set class_id to NULL)
    if (studentCount && studentCount > 0) {
      await supabaseAdmin
        .from('students')
        .update({ class_id: null })
        .eq('class_id', id)
        .eq('church_id', churchId);
    }

    // Delete all tests associated with this class
    if (testCount && testCount > 0) {
      // First delete all test results for these tests
      const { data: tests } = await supabaseAdmin
        .from('tests')
        .select('id')
        .eq('class_id', id)
        .eq('church_id', churchId);

      if (tests && tests.length > 0) {
        const testIds = tests.map(t => t.id);

        // Delete test results first (due to foreign key constraint)
        await supabaseAdmin
          .from('test_results')
          .delete()
          .in('test_id', testIds);
      }

      // Now delete the tests
      await supabaseAdmin
        .from('tests')
        .delete()
        .eq('class_id', id)
        .eq('church_id', churchId);
    }

    // Finally, delete the class
    await deleteClass(id, churchId);

    return NextResponse.json({
      message: 'Class deleted successfully',
      studentsUnassigned: studentCount || 0,
      testsDeleted: testCount || 0,
    });
  } catch (error) {
    console.error('Error deleting class:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete class' },
      { status: 500 }
    );
  }
}
