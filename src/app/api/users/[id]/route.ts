import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentChurchId, hasPermission, getCurrentUserId } from '@/lib/auth-helpers';

/**
 * GET /api/users/[id]
 * Get a specific user
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const canManage = await hasPermission('canManageUsers');

    if (!canManage) {
      return NextResponse.json(
        { error: 'You do not have permission to manage users. Please contact your church administrator to request the "Manage Users" permission.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const churchId = await getCurrentChurchId();

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select(`
        *,
        church:churches (
          id,
          name
        )
      `)
      .eq('id', id)
      .eq('church_id', churchId)
      .single();

    if (error) throw error;

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/users/[id]
 * Update a user
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const canManage = await hasPermission('canManageUsers');

    if (!canManage) {
      return NextResponse.json(
        { error: 'You do not have permission to manage users. Please contact your church administrator to request the "Manage Users" permission.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const churchId = await getCurrentChurchId();
    const { name, role, permissions } = await request.json();

    // Get current user data
    const { data: currentUser } = await supabaseAdmin
      .from('users')
      .select('role, permissions')
      .eq('id', id)
      .eq('church_id', churchId)
      .single();

    // Check if we're removing admin privileges
    const wasAdmin = currentUser?.role === 'church_admin' || currentUser?.role === 'admin' || currentUser?.permissions?.canManageUsers;
    const willBeAdmin = role === 'church_admin' || role === 'admin' || permissions?.canManageUsers;

    if (wasAdmin && !willBeAdmin) {
      // Count remaining admins
      const { data: admins } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('church_id', churchId)
        .neq('id', id)
        .or('role.eq.church_admin,role.eq.admin,permissions->>canManageUsers.eq.true');

      if (!admins || admins.length === 0) {
        return NextResponse.json(
          { error: 'Cannot remove admin privileges from the last user with admin access. At least one admin must remain.' },
          { status: 400 }
        );
      }
    }

    const updateData: any = { name, role, permissions };
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', id)
      .eq('church_id', churchId)
      .select(`
        *,
        church:churches (
          id,
          name
        )
      `)
      .single();

    if (error) throw error;

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update user' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/[id]
 * Delete a user
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const canManage = await hasPermission('canManageUsers');

    if (!canManage) {
      return NextResponse.json(
        { error: 'You do not have permission to manage users. Please contact your church administrator to request the "Manage Users" permission.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const churchId = await getCurrentChurchId();
    const currentUserId = await getCurrentUserId();

    // Prevent user from deleting themselves
    if (id === currentUserId) {
      return NextResponse.json(
        { error: 'You cannot delete your own account. Please ask another admin to do this.' },
        { status: 400 }
      );
    }

    // Get user being deleted
    const { data: userToDelete } = await supabaseAdmin
      .from('users')
      .select('role, permissions')
      .eq('id', id)
      .eq('church_id', churchId)
      .single();

    if (!userToDelete) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is an admin
    const isAdmin = userToDelete.role === 'church_admin' || userToDelete.role === 'admin' || userToDelete.permissions?.canManageUsers;

    if (isAdmin) {
      // Count remaining admins (excluding the one being deleted)
      const { data: admins } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('church_id', churchId)
        .neq('id', id)
        .or('role.eq.church_admin,role.eq.admin,permissions->>canManageUsers.eq.true');

      if (!admins || admins.length === 0) {
        return NextResponse.json(
          { error: 'Cannot delete the last user with admin access. At least one admin must remain.' },
          { status: 400 }
        );
      }
    }

    // Delete from users table (this is within church context)
    const { error: userError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id)
      .eq('church_id', churchId);

    if (userError) throw userError;

    // Delete from Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);

    if (authError) {
      console.error('Error deleting auth user:', authError);
      // Continue anyway, user profile is deleted
    }

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete user' },
      { status: 500 }
    );
  }
}
