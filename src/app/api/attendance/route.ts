import { NextResponse } from "next/server";
import { getAttendanceByDate, getAttendanceStats } from "@/lib/supabase-helpers";
import { supabaseAdmin } from "@/lib/supabase";
import { getTempChurchId } from "@/lib/temp-auth";

export async function GET(request: Request) {
  try {
    const churchId = await getTempChurchId();
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const date = searchParams.get("date");
    const statsOnly = searchParams.get("statsOnly") === "true";

    // If specific date requested, get attendance for that date
    if (date) {
      const attendance = await getAttendanceByDate(churchId, date);
      return NextResponse.json(attendance);
    }

    // If date range requested with statsOnly flag
    if (startDate && endDate && statsOnly) {
      const stats = await getAttendanceStats(churchId, startDate, endDate);
      return NextResponse.json(stats);
    }

    // Get all students with their attendance (optionally filtered by date range)
    let query = supabaseAdmin
      .from('students')
      .select(`
        id,
        first_name,
        last_name,
        attendance (
          id,
          date,
          present
        )
      `)
      .eq('church_id', churchId)
      .order('last_name', { ascending: true });

    const { data: students, error } = await query;

    if (error) throw error;

    // Filter attendance by date range if provided
    let formattedStudents = students.map((student: any) => {
      let filteredAttendance = student.attendance || [];

      if (startDate && endDate) {
        filteredAttendance = filteredAttendance.filter((att: any) => {
          return att.date >= startDate && att.date <= endDate;
        });
      }

      return {
        _id: student.id, // Keep MongoDB format for compatibility
        firstName: student.first_name,
        lastName: student.last_name,
        attendance: filteredAttendance,
      };
    });

    return NextResponse.json(formattedStudents);
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const churchId = await getTempChurchId();
    const body = await request.json();

    // Support both single and batch attendance submissions
    const records = Array.isArray(body) ? body : [body];
    console.log("Received attendance records:", records);

    // Batch insert/update using upsert
    const attendanceRecords = records
      .filter((r: any) => r.studentId && r.date && typeof r.present === "boolean")
      .map((r: any) => ({
        student_id: r.studentId,
        class_id: r.classId, // Get from record or use temp
        date: r.date,
        present: r.present,
      }));

    if (attendanceRecords.length === 0) {
      return NextResponse.json(
        { error: "No valid attendance records provided" },
        { status: 400 }
      );
    }

    // Use upsert to insert or update attendance
    const { data, error } = await supabaseAdmin
      .from('attendance')
      .upsert(attendanceRecords, {
        onConflict: 'student_id,date,class_id',
      });

    if (error) throw error;

    return NextResponse.json({ updated: attendanceRecords.length });
  } catch (error) {
    console.error("Attendance API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
