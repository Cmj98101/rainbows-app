import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Test from "@/models/Test";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const param = await params;
    const test = await Test.findById(param.id);
    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }
    return NextResponse.json(test);
  } catch (error) {
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
    await connectDB();
    const param = await params;
    const { name, date } = await request.json();
    const test = await Test.findByIdAndUpdate(
      param.id,
      { name, date },
      { new: true }
    );
    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }
    return NextResponse.json(test);
  } catch (error) {
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
    await connectDB();
    const param = await params;
    const test = await Test.findByIdAndDelete(param.id);
    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete test" },
      { status: 500 }
    );
  }
}
