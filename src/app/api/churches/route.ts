import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentChurchId, requireRole } from '@/lib/auth-helpers';

/**
 * GET /api/churches
 * Get church information (requires authentication)
 */
export async function GET() {
  try {
    const churchId = await getCurrentChurchId();

    const { data: church, error } = await supabaseAdmin
      .from('churches')
      .select('*')
      .eq('id', churchId)
      .single();

    if (error) throw error;

    return NextResponse.json(church);
  } catch (error) {
    console.error('Error fetching church:', error);
    return NextResponse.json(
      { error: 'Failed to fetch church' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/churches
 * Create a new church (public - for onboarding)
 */
export async function POST(request: Request) {
  try {
    const { name, email, phone, address } = await request.json();

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    const { data: church, error } = await supabaseAdmin
      .from('churches')
      .insert({
        name,
        email,
        phone,
        address: address || {},
        subscription: 'free',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(church, { status: 201 });
  } catch (error) {
    console.error('Error creating church:', error);
    return NextResponse.json(
      { error: 'Failed to create church' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/churches
 * Update church information (requires church_admin role)
 */
export async function PUT(request: Request) {
  try {
    await requireRole('church_admin');
    const churchId = await getCurrentChurchId();
    const { name, email, phone, address } = await request.json();

    const { data: church, error } = await supabaseAdmin
      .from('churches')
      .update({ name, email, phone, address })
      .eq('id', churchId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(church);
  } catch (error) {
    console.error('Error updating church:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update church' },
      { status: error instanceof Error && error.message.includes('permission') ? 403 : 500 }
    );
  }
}
