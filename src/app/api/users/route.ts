import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentChurchId, requireRole, hasPermission } from '@/lib/auth-helpers';

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * GET /api/users
 * Get all users in the current church (requires canManageUsers permission)
 */
export async function GET() {
  try {
    const canManage = await hasPermission('canManageUsers');

    if (!canManage) {
      return NextResponse.json(
        { error: 'You do not have permission to manage users. Please contact your church administrator to request the "Manage Users" permission.' },
        { status: 403 }
      );
    }

    const churchId = await getCurrentChurchId();

    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select(`
        *,
        church:churches (
          id,
          name
        )
      `)
      .eq('church_id', churchId)
      .order('name', { ascending: true });

    if (error) throw error;

    // Don't send sensitive data
    const sanitizedUsers = users.map(({ ...user }) => user);

    return NextResponse.json(sanitizedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users
 * Create a new user (requires church_admin or admin with canManageUsers)
 */
export async function POST(request: Request) {
  try {
    const canManage = await hasPermission('canManageUsers');

    if (!canManage) {
      return NextResponse.json(
        { error: 'You do not have permission to manage users. Please contact your church administrator to request the "Manage Users" permission.' },
        { status: 403 }
      );
    }

    const churchId = await getCurrentChurchId();
    const { email, password, name, role, permissions } = await request.json();

    // Validate required fields
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: 'Email, password, name, and role are required' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check for duplicate email
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: `A user with email "${email}" already exists.` },
        { status: 400 }
      );
    }

    // Validate role
    if (!['church_admin', 'admin', 'teacher'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Create auth user in Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for now
    });

    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: authError.message || 'Failed to create auth user' },
        { status: 400 }
      );
    }

    // Set default permissions based on role
    let defaultPermissions = {
      canManageUsers: false,
      canManageClasses: false,
      canEditStudents: true,
      canTakeAttendance: true,
      canManageTests: true,
      canViewReports: false,
    };

    if (role === 'church_admin') {
      defaultPermissions = {
        canManageUsers: true,
        canManageClasses: true,
        canEditStudents: true,
        canTakeAttendance: true,
        canManageTests: true,
        canViewReports: true,
      };
    } else if (role === 'admin') {
      defaultPermissions = {
        canManageUsers: true,
        canManageClasses: true,
        canEditStudents: true,
        canTakeAttendance: true,
        canManageTests: true,
        canViewReports: true,
      };
    }

    // Create user profile in users table
    const insertData: any = {
      id: authUser.user.id, // Use the same ID as auth user
      church_id: churchId,
      email,
      name,
      role,
      permissions: permissions || defaultPermissions,
    };
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .insert(insertData)
      .select(`
        *,
        church:churches (
          id,
          name
        )
      `)
      .single();

    if (userError) {
      // Rollback: delete auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      throw userError;
    }

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create user' },
      { status: 500 }
    );
  }
}
