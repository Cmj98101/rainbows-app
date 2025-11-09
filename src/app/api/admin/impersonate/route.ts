import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireAuth, hasRole } from "@/lib/auth-helpers";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    // Verify the user is a church_admin
    const session = await requireAuth();
    const isChurchAdmin = await hasRole('church_admin');

    if (!isChurchAdmin) {
      return NextResponse.json(
        { error: 'Only church administrators can impersonate users' },
        { status: 403 }
      );
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Verify the target user exists and belongs to the same church
    const { data: targetUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role, church_id')
      .eq('id', userId)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify same church (optional security check)
    if (targetUser.church_id !== session.user.church.id) {
      return NextResponse.json(
        { error: 'Cannot impersonate users from other churches' },
        { status: 403 }
      );
    }

    // Set impersonation cookies
    const cookieStore = await cookies();

    // Store the original user ID and the impersonated user ID
    cookieStore.set('impersonating-user-id', userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    cookieStore.set('original-user-id', session.user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return NextResponse.json({
      success: true,
      impersonating: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
      }
    });
  } catch (error) {
    console.error("Error starting impersonation:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to start impersonation" },
      { status: 500 }
    );
  }
}
