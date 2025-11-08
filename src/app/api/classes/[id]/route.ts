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
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { teacherIds, ...classUpdates } = body;

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
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Check if class has students
    const { count: studentCount } = await supabaseAdmin
      .from('students')
      .select('id', { count: 'exact' })
      .eq('class_id', id)
      .eq('church_id', churchId);

    if (studentCount && studentCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete class with ${studentCount} student${studentCount !== 1 ? 's' : ''}. Please reassign or remove the students first.`
        },
        { status: 400 }
      );
    }

    // Check if class has tests
    const { count: testCount } = await supabaseAdmin
      .from('tests')
      .select('id', { count: 'exact' })
      .eq('class_id', id)
      .eq('church_id', churchId);

    if (testCount && testCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete class with ${testCount} test${testCount !== 1 ? 's' : ''}. Please delete the tests first.`
        },
        { status: 400 }
      );
    }

    await deleteClass(id, churchId);

    return NextResponse.json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Error deleting class:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete class' },
      { status: 500 }
    );
  }
}
