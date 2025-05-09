import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Student from "@/models/Student";

export async function GET(request: Request) {
  try {
    await connectDB();

    // Get date range from query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const students = await Student.find({}).select(
      "firstName lastName attendance"
    );

    // Filter attendance records based on date range if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include the entire end date

      students.forEach((student: any) => {
        student.attendance = student.attendance.filter((record: any) => {
          const recordDate = new Date(record.date);
          return recordDate >= start && recordDate <= end;
        });
      });
    }

    // Convert dates to ISO strings for consistent handling
    const formattedStudents = students.map((student: any) => ({
      ...student.toObject(),
      attendance: student.attendance.map((record: any) => ({
        ...record,
        date: new Date(record.date).toISOString(),
      })),
    }));

    return NextResponse.json(formattedStudents);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch attendance" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();

    // Support both single and batch attendance submissions
    const records = Array.isArray(body) ? body : [body];
    console.log("Received attendance records:", records); // Debug log
    const updatedStudents = [];
    for (const record of records) {
      const { studentId, date, present } = record;
      if (!studentId || !date || typeof present !== "boolean") {
        console.error("Invalid record:", record);
        continue;
      }
      // Find the student and update only the attendance array
      const student = await Student.findById(studentId);
      if (!student) {
        console.error("Student not found:", studentId);
        continue;
      }
      // Remove any existing attendance record for this date
      const filteredAttendance = student.attendance.filter(
        (r: any) => new Date(r.date).toISOString().split("T")[0] !== date
      );
      // Add the new/updated record
      filteredAttendance.push({ date: new Date(date), present });
      // Update only the attendance field
      await Student.findByIdAndUpdate(studentId, {
        $set: { attendance: filteredAttendance },
      });
      updatedStudents.push(studentId);
    }
    return NextResponse.json({ updated: updatedStudents.length });
  } catch (error) {
    console.error("Attendance API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
