import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * POST /api/onboarding
 * Complete church onboarding - create church + first admin user
 */
export async function POST(request: Request) {
  try {
    const {
      churchName,
      churchEmail,
      churchPhone,
      churchAddress,
      adminName,
      adminEmail,
      adminPassword,
    } = await request.json();

    // Validate required fields
    if (!churchName || !churchEmail || !adminName || !adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Step 1: Create the church
    const churchData: any = {
      name: churchName,
      email: churchEmail,
      phone: churchPhone,
      address: churchAddress || {},
      subscription: 'free',
    };
    const { data: church, error: churchError } = await supabaseAdmin
      .from('churches')
      .insert(churchData)
      .select()
      .single();

    if (churchError) {
      console.error('Church creation error:', churchError);
      return NextResponse.json(
        { error: 'Failed to create church' },
        { status: 500 }
      );
    }

    // Step 2: Create auth user for admin
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true, // Auto-confirm for first admin
    });

    if (authError) {
      // Rollback: delete church if user creation fails
      await supabaseAdmin.from('churches').delete().eq('id', church.id);

      console.error('Auth user creation error:', authError);
      return NextResponse.json(
        { error: authError.message || 'Failed to create admin user' },
        { status: 400 }
      );
    }

    // Step 3: Create user profile with church_admin role
    const userData: any = {
      id: authUser.user.id,
      church_id: church.id,
      email: adminEmail,
      name: adminName,
      role: 'church_admin',
      permissions: {
        canManageUsers: true,
        canManageClasses: true,
        canEditStudents: true,
        canTakeAttendance: true,
        canManageTests: true,
        canViewReports: true,
      },
    };
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (userError) {
      // Rollback: delete auth user and church
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      await supabaseAdmin.from('churches').delete().eq('id', church.id);

      console.error('User profile creation error:', userError);
      return NextResponse.json(
        { error: 'Failed to create admin profile' },
        { status: 500 }
      );
    }

    // Step 4: Sign in the newly created admin
    const { data: session, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    });

    if (signInError || !session.session) {
      console.error('Auto sign-in error:', signInError);
      // Don't rollback here - user can sign in manually
      return NextResponse.json({
        church,
        user,
        message: 'Church and admin created successfully. Please sign in.',
        requiresSignIn: true,
      }, { status: 201 });
    }

    // Create response with session cookies
    const response = NextResponse.json({
      church,
      user,
      session: session.session,
      message: 'Church onboarding completed successfully',
    }, { status: 201 });

    // Set session cookies on response
    response.cookies.set('sb-access-token', session.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    response.cookies.set('sb-refresh-token', session.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    console.log('✅ Onboarding complete, cookies set for:', adminEmail);

    return response;
  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Onboarding failed' },
      { status: 500 }
    );
  }
}
