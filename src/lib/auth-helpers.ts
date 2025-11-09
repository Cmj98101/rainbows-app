/**
 * Supabase Auth Helper Functions
 *
 * Provides authentication and session management using Supabase Auth
 */

import { cookies } from 'next/headers';
import { supabaseAdmin } from './supabase';
import { getUserByEmail, getUserById } from './supabase-helpers';

/**
 * Get the current authenticated user's session
 * Supports impersonation: if a church_admin is impersonating another user,
 * this will return the impersonated user's session
 */
export async function getSession() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('sb-access-token')?.value;
  const refreshToken = cookieStore.get('sb-refresh-token')?.value;

  if (!accessToken) {
    return null;
  }

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);

    if (error || !user) {
      return null;
    }

    // Get user profile from our users table
    const userProfile = await getUserByEmail(user.email!);

    // Check if we're impersonating another user
    const impersonatingUserId = cookieStore.get('impersonating-user-id')?.value;
    const originalUserId = cookieStore.get('original-user-id')?.value;

    if (impersonatingUserId && originalUserId) {
      // Verify the original user is a church_admin
      if (userProfile?.role === 'church_admin') {
        try {
          // Get the impersonated user's profile
          const impersonatedProfile = await getUserById(impersonatingUserId);

          return {
            user: {
              id: impersonatedProfile.id,
              email: impersonatedProfile.email,
              ...impersonatedProfile,
            },
            accessToken,
            refreshToken,
            impersonation: {
              isImpersonating: true,
              originalUserId: originalUserId,
              originalUserName: userProfile.name,
              impersonatedUserId: impersonatingUserId,
              impersonatedUserName: impersonatedProfile.name,
            }
          };
        } catch (impersonationError) {
          console.error('Error loading impersonated user, falling back to original:', impersonationError);
          // Fall through to return original user session
        }
      }
    }

    return {
      user: {
        id: user.id,
        email: user.email!,
        ...userProfile,
      },
      accessToken,
      refreshToken,
      impersonation: {
        isImpersonating: false,
      }
    };
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

/**
 * Get the current user's church ID
 */
export async function getCurrentChurchId(): Promise<string> {
  const session = await getSession();

  if (!session?.user?.church?.id) {
    throw new Error('Not authenticated or no church associated');
  }

  return session.user.church.id;
}

/**
 * Get the current user's ID
 */
export async function getCurrentUserId(): Promise<string> {
  const session = await getSession();

  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  return session.user.id;
}

/**
 * Check if the current user has a specific role
 */
export async function hasRole(role: 'church_admin' | 'admin' | 'teacher'): Promise<boolean> {
  const session = await getSession();

  if (!session?.user?.role) {
    return false;
  }

  // church_admin has all permissions
  if (session.user.role === 'church_admin') {
    return true;
  }

  // admin can access admin and teacher features
  if (session.user.role === 'admin' && (role === 'admin' || role === 'teacher')) {
    return true;
  }

  // exact role match
  return session.user.role === role;
}

/**
 * Check if the current user has a specific permission
 */
export async function hasPermission(permission: keyof {
  canManageUsers: boolean;
  canManageClasses: boolean;
  canEditStudents: boolean;
  canTakeAttendance: boolean;
  canManageTests: boolean;
  canViewReports: boolean;
}): Promise<boolean> {
  const session = await getSession();

  if (!session?.user?.permissions) {
    return false;
  }

  return session.user.permissions[permission] === true;
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth() {
  const session = await getSession();

  if (!session) {
    throw new Error('Authentication required');
  }

  return session;
}

/**
 * Require specific role - throws if user doesn't have role
 */
export async function requireRole(role: 'church_admin' | 'admin' | 'teacher') {
  const session = await requireAuth();

  const hasRequiredRole = await hasRole(role);

  if (!hasRequiredRole) {
    throw new Error(`Insufficient permissions. Required role: ${role}`);
  }

  return session;
}
