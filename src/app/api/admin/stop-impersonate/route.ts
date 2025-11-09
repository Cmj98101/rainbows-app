import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();

    // Remove impersonation cookies
    cookieStore.delete('impersonating-user-id');
    cookieStore.delete('original-user-id');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error stopping impersonation:", error);
    return NextResponse.json(
      { error: "Failed to stop impersonation" },
      { status: 500 }
    );
  }
}
