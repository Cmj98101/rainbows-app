import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import StudentModel from "@/models/Student";
import { Student } from "@/types/student";
import StudentsTable from "./StudentsTable";

async function getStudents() {
  try {
    await connectDB();
    const students = await StudentModel.find({}).lean();
    return students as unknown as Student[];
  } catch (error) {
    console.error("Error fetching students:", error);
    throw new Error("Failed to fetch students");
  }
}

export default async function StudentsPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/signin");
  }

  const students = await getStudents();
  const plainStudents = JSON.parse(JSON.stringify(students));
  return <StudentsTable students={plainStudents} />;
}
