import { NextResponse } from "next/server";
import { getTestById, deleteTest } from "@/lib/supabase-helpers";
import { supabaseAdmin } from "@/lib/supabase";
import { getCurrentChurchId, requireAuth } from "@/lib/auth-helpers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const churchId = await getCurrentChurchId();

    const test = await getTestById(id, churchId);
    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    // Transform Supabase format to MongoDB format for frontend compatibility
    const formattedTest = {
      _id: test.id,
      name: test.name,
      date: test.date,
      description: test.description,
    };

    return NextResponse.json(formattedTest);
  } catch (error) {
    console.error("Error fetching test:", error);
    return NextResponse.json(
      { error: "Failed to fetch test" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const churchId = await getCurrentChurchId();
    const { name, date, description } = await request.json();

    const { data: test, error } = await supabaseAdmin
      .from('tests')
      .update({ name, date, description })
      .eq('id', id)
      .eq('church_id', churchId)
      .select()
      .single();

    if (error) throw error;
    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    // Transform to MongoDB format
    const formattedTest = {
      _id: test.id,
      name: test.name,
      date: test.date,
      description: test.description,
    };

    return NextResponse.json(formattedTest);
  } catch (error) {
    console.error("Error updating test:", error);
    return NextResponse.json(
      { error: "Failed to update test" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const churchId = await getCurrentChurchId();

    await deleteTest(id, churchId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting test:", error);
    return NextResponse.json(
      { error: "Failed to delete test" },
      { status: 500 }
    );
  }
}
