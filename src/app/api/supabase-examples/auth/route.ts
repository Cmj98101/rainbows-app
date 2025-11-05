/**
 * Example API Route: Authentication with Supabase Auth
 *
 * This file demonstrates how to replace NextAuth with Supabase Auth
 * for user authentication and session management.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type { UserRole } from '@/types/supabase';

/**
 * POST /api/supabase-examples/auth/signup
 * Register a new user with church assignment
 */
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'signup') {
    return handleSignup(request);
  } else if (action === 'signin') {
    return handleSignin(request);
  } else if (action === 'signout') {
    return handleSignout(request);
  } else if (action === 'session') {
    return getSession(request);
  }

  return NextResponse.json(
    { error: 'Invalid action' },
    { status: 400 }
  );
}

/**
 * Sign up a new user
 */
async function handleSignup(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, churchId, role = 'teacher' } = body;

    // Validate required fields
    if (!email || !password || !name || !churchId) {
      return NextResponse.json(
        { error: 'Email, password, name, and church ID are required' },
        { status: 400 }
      );
    }

    // Create auth user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for now
    });

    if (authError || !authData.user) {
      console.error('Error creating auth user:', authError);
      return NextResponse.json(
        { error: authError?.message || 'Failed to create user' },
        { status: 500 }
      );
    }

    // Create user record in users table
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        church_id: churchId,
        email,
        name,
        role: role as UserRole,
        permissions: {
          canManageUsers: role === 'church_admin',
          canManageClasses: role === 'church_admin',
          canEditStudents: true,
          canTakeAttendance: true,
          canManageTests: true,
          canViewReports: role !== 'teacher',
        },
      })
      .select()
      .single();

    if (userError) {
      console.error('Error creating user record:', userError);
      // Rollback: delete auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: 'Failed to create user record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Sign in a user (client-side example)
 *
 * NOTE: In practice, sign-in is typically handled on the client side
 * using supabase.auth.signInWithPassword()
 *
 * This is just an example of the flow.
 */
async function handleSignin(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Note: This should typically be done client-side
    // Server-side sign-in for demonstration purposes
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Get user details from users table
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    return NextResponse.json({
      message: 'Signed in successfully',
      session: data.session,
      user,
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Sign out a user
 */
async function handleSignout(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      );
    }

    const { error } = await supabaseAdmin.auth.admin.signOut(token);

    if (error) {
      console.error('Error signing out:', error);
      return NextResponse.json(
        { error: 'Failed to sign out' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Signed out successfully' });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get current session
 */
async function getSession(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      );
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Get user details from users table
    const { data: userRecord } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      user: userRecord,
      session: { user },
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
