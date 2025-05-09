import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Student from "@/models/Student";
import Test from "@/models/Test";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const { results } = await request.json();
    const testId = params.id;
    console.log("Received results for test:", testId, results); // Debug log
    const test = await Test.findById(testId);
    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }
    const testName = test.name;
    const testDate = test.date;
    const updates = await Promise.all(
      Object.entries(results).map(async ([studentId, status]) => {
        const student = await Student.findById(studentId);
        if (!student) return null;
        // Remove any existing result for this test
        student.testResults = student.testResults.filter(
          (r: any) => r.testId.toString() !== testId.toString()
        );
        // Add the new/updated result
        student.testResults.push({
          testId,
          testName,
          date: testDate,
          status,
        });
        await student.save();
        return student._id;
      })
    );
    return NextResponse.json({ updated: updates.filter(Boolean) });
  } catch (error) {
    console.error("Error saving test results:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
