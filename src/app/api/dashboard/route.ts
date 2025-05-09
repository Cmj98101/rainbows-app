import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Student from "@/models/Student";

export async function GET() {
  try {
    await connectDB();

    // Get total students count
    const totalStudents = await Student.countDocuments();

    // Get today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const students = await Student.find({});
    const todayAttendance = students.filter((student) =>
      student.attendance.some(
        (record: any) =>
          record.date.toISOString().split("T")[0] ===
            today.toISOString().split("T")[0] && record.present
      )
    ).length;
    const todayAttendanceRate =
      totalStudents > 0
        ? Math.round((todayAttendance / totalStudents) * 100)
        : 0;

    // Get test pass rate
    const studentsWithTests = students.filter(
      (student) => student.testResults && student.testResults.length > 0
    );
    const totalTests = studentsWithTests.reduce(
      (acc, student) => acc + student.testResults.length,
      0
    );
    const passedTests = studentsWithTests.reduce(
      (acc, student) =>
        acc +
        student.testResults.filter((test: any) => test.status === "passed")
          .length,
      0
    );
    const testPassRate =
      totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

    return NextResponse.json({
      totalStudents,
      todayAttendanceRate,
      testPassRate,
      recentActivity: [], // We'll implement this later
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
