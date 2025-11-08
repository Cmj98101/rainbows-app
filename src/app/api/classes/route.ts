import { NextResponse } from 'next/server';
import { getClasses, createClass, getClassesForTeacher } from '@/lib/supabase-helpers';
import { getCurrentChurchId, requireAuth, hasPermission, hasRole, getCurrentUserId } from '@/lib/auth-helpers';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/classes
 * Get all classes for the current church (admins) or assigned classes (teachers)
 */
export async function GET() {
  try {
    await requireAuth();
    const churchId = await getCurrentChurchId();

    // Check if user is a teacher (non-admin)
    const isTeacher = await hasRole('teacher');
    const isAdmin = await hasRole('admin') || await hasRole('church_admin');

    let classes;
    if (isTeacher && !isAdmin) {
      // Teachers can only see their assigned classes
      const userId = await getCurrentUserId();
      classes = await getClassesForTeacher(userId);
    } else {
      // Admins can see all classes
      classes = await getClasses(churchId);
    }

    return NextResponse.json(classes);
  } catch (error) {
    console.error('Error fetching classes:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch classes' },
      { status: error instanceof Error && error.message.includes('Authentication') ? 401 : 500 }
    );
  }
}

/**
 * POST /api/classes
 * Create a new class (requires canManageClasses permission)
 */
export async function POST(request: Request) {
  try {
    const canManage = await hasPermission('canManageClasses');

    if (!canManage) {
      return NextResponse.json(
        { error: 'You do not have permission to create classes. Please contact your church administrator to request the "Manage Classes" permission.' },
        { status: 403 }
      );
    }

    const churchId = await getCurrentChurchId();
    const { name, ageGroup, description, schedule, teacherIds } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Check for duplicate class name
    const { data: existingClass } = await supabaseAdmin
      .from('classes')
      .select('id, name')
      .eq('church_id', churchId)
      .eq('name', name)
      .single();

    if (existingClass) {
      return NextResponse.json(
        { error: `A class named "${name}" already exists. Please use a different name.` },
        { status: 400 }
      );
    }

    const classData = await createClass(churchId, {
      name,
      age_group: ageGroup,
      description,
      schedule: schedule || {},
    });

    // Assign teachers if provided
    if (teacherIds && teacherIds.length > 0) {
      const { assignTeachersToClass } = await import('@/lib/supabase-helpers');
      await assignTeachersToClass(classData.id, teacherIds);
    }

    return NextResponse.json(classData, { status: 201 });
  } catch (error) {
    console.error('Error creating class:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create class' },
      { status: 500 }
    );
  }
}
