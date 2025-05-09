import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Student from "@/models/Student";

export async function GET() {
  try {
    console.log("Connecting to database...");
    await connectDB();
    console.log("Fetching students...");
    const students = await Student.find({}).sort({ lastName: 1, firstName: 1 });
    console.log(`Found ${students.length} students`);
    return NextResponse.json(students);
  } catch (error) {
    console.error("Error in GET /api/students:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch students",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log("Connecting to database...");
    await connectDB();
    const body = await request.json();
    console.log("Creating new student:", body);
    const student = await Student.create(body);
    console.log("Student created:", student._id);
    return NextResponse.json(student, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/students:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create student",
      },
      { status: 500 }
    );
  }
}
