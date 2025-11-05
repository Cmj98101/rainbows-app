import { NextResponse } from "next/server";
import { getTests, createTest } from "@/lib/supabase-helpers";
import { getTempChurchId, getTempClassId } from "@/lib/temp-auth";

export async function GET() {
  try {
    const churchId = await getTempChurchId();
    const tests = await getTests(churchId);
    return NextResponse.json(tests);
  } catch (error) {
    console.error("Error fetching tests:", error);
    return NextResponse.json(
      { error: "Failed to fetch tests" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const churchId = await getTempChurchId();
    const classId = await getTempClassId();
    const { name, date, description } = await request.json();

    const test = await createTest(churchId, {
      name,
      date,
      description,
      class_id: classId,
    });

    return NextResponse.json(test, { status: 201 });
  } catch (error) {
    console.error("Error creating test:", error);
    return NextResponse.json({ error: "Failed to add test" }, { status: 500 });
  }
}
