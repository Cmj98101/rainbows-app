import { NextResponse } from "next/server";
import { saveTestResults } from "@/lib/supabase-helpers";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: testId } = await params;
    const { results } = await request.json();

    console.log("Received results for test:", testId, results);

    // Convert results object to array format
    const resultsArray = Object.entries(results).map(([studentId, status]) => ({
      student_id: studentId,
      status: status as 'passed' | 'failed' | 'absent',
    }));

    const savedResults = await saveTestResults(testId, resultsArray);

    return NextResponse.json({ updated: savedResults.length });
  } catch (error) {
    console.error("Error saving test results:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
