import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Student from "@/models/Student";

export async function GET() {
  try {
    console.log("Connecting to database...");
    await connectDB();
    console.log("Database connected successfully");

    // Get total students count
    console.log("Fetching total students count...");
    const totalStudents = await Student.countDocuments();
    console.log(`Total students: ${totalStudents}`);

    // Get today's attendance
    console.log("Calculating today's attendance...");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const students = await Student.find({});
    console.log(`Found ${students.length} students for attendance calculation`);

    const todayAttendance = students.filter((student) =>
      student.attendance?.some(
        (record: any) =>
          record.date.toISOString().split("T")[0] ===
            today.toISOString().split("T")[0] && record.present
      )
    ).length;
    console.log(`Today's attendance: ${todayAttendance}`);

    const todayAttendanceRate =
      totalStudents > 0
        ? Math.round((todayAttendance / totalStudents) * 100)
        : 0;
    console.log(`Attendance rate: ${todayAttendanceRate}%`);

    // Get test pass rate
    console.log("Calculating test pass rate...");
    const studentsWithTests = students.filter(
      (student) => student.testResults && student.testResults.length > 0
    );
    console.log(`Students with tests: ${studentsWithTests.length}`);

    const totalTests = studentsWithTests.reduce(
      (acc, student) => acc + (student.testResults?.length || 0),
      0
    );
    console.log(`Total tests: ${totalTests}`);

    const passedTests = studentsWithTests.reduce(
      (acc, student) =>
        acc +
        (student.testResults?.filter((test: any) => test.status === "passed")
          .length || 0),
      0
    );
    console.log(`Passed tests: ${passedTests}`);

    const testPassRate =
      totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
    console.log(`Test pass rate: ${testPassRate}%`);

    return NextResponse.json({
      totalStudents,
      todayAttendanceRate,
      testPassRate,
      recentActivity: [], // We'll implement this later
    });
  } catch (error) {
    console.error("Error in dashboard API:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch dashboard data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
