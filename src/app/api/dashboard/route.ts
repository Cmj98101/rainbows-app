import { NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/supabase-helpers";
import { getTempChurchId } from "@/lib/temp-auth";

export async function GET() {
  try {
    console.log("Fetching dashboard data from Supabase...");
    const churchId = await getTempChurchId();

    const stats = await getDashboardStats(churchId);
    console.log("Dashboard stats:", stats);

    const response = {
      totalStudents: stats.totalStudents,
      todayAttendanceRate: stats.attendanceToday.attendanceRate,
      testPassRate: stats.recentTests.length > 0
        ? Math.round(
            stats.recentTests.reduce((acc, t) => acc + t.passRate, 0) /
              stats.recentTests.length
          )
        : 0,
      recentTests: stats.recentTests,
      recentActivity: [],
    };

    console.log("Sending response:", response);
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in dashboard API:", error);
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return NextResponse.json(
      {
        error: "Failed to fetch dashboard data",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
