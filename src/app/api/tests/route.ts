import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Test from "@/models/Test";

export async function GET() {
  try {
    await connectDB();
    const tests = await Test.find({}).sort({ date: -1 });
    return NextResponse.json(tests);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch tests" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const { name, date } = await request.json();
    const test = await Test.create({ name, date });
    return NextResponse.json(test, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to add test" }, { status: 500 });
  }
}
