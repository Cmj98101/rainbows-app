import { NextResponse } from "next/server";
import Student from "@/models/Student";
import connectToDatabase from "@/lib/db";

interface Guardian {
  name?: string;
  relationship?: string;
  phone?: string;
  email?: string;
  address?: string;
  isEmergencyContact?: boolean;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();
    const student = await Student.findById(id);
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }
    return NextResponse.json(student);
  } catch (error) {
    console.error("Error fetching student:", error);
    return NextResponse.json(
      { error: "Failed to fetch student" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    await connectToDatabase();

    // Process guardian data
    const guardians = (data.guardians || []).map((guardian: Guardian) => ({
      name: guardian.name?.trim() || "",
      relationship: guardian.relationship?.trim() || "",
      phone: guardian.phone?.trim() || "",
      email: guardian.email?.trim() || "",
      address: guardian.address?.trim() || "",
      isEmergencyContact: Boolean(guardian.isEmergencyContact),
    }));

    // Ensure all required guardian fields are present
    const validGuardians = guardians.filter(
      (guardian: { name: string; relationship: string; phone: string }) =>
        guardian.name && guardian.relationship && guardian.phone
    );

    // Remove guardians from the main update data
    const { guardians: _, ...restData } = data;

    console.log("Updating student with data:", {
      ...restData,
      guardians: validGuardians,
    }); // Debug log

    const student = await Student.findByIdAndUpdate(
      id,
      {
        $set: {
          ...restData,
          guardians: validGuardians,
        },
      },
      { new: true, runValidators: true }
    );

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    console.log("Updated student:", student); // Debug log
    return NextResponse.json(student);
  } catch (error) {
    console.error("Error updating student:", error);
    return NextResponse.json(
      { error: "Failed to update student" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();
    const student = await Student.findByIdAndDelete(id);
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Student deleted successfully" });
  } catch (error) {
    console.error("Error deleting student:", error);
    return NextResponse.json(
      { error: "Failed to delete student" },
      { status: 500 }
    );
  }
}
