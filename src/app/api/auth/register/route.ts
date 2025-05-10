import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { registrationLimiter, checkRateLimit } from "@/lib/rateLimiter";

// This should be moved to an environment variable in production
const VALID_REGISTRATION_CODES = ["RAINBOW2024"];

export async function POST(request: Request) {
  try {
    const { name, email, password, registrationCode } = await request.json();

    if (!name || !email || !password || !registrationCode) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check rate limit using IP address or email as key
    const rateLimitResult = await checkRateLimit(
      registrationLimiter,
      email // Using email as the key for rate limiting
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: rateLimitResult.message },
        { status: 429 }
      );
    }

    // Validate registration code
    if (!VALID_REGISTRATION_CODES.includes(registrationCode)) {
      return NextResponse.json(
        { error: "Invalid registration code" },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      registrationCode,
      role: "teacher", // Default role
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user.toObject();

    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error("Error in register API:", error);
    return NextResponse.json(
      {
        error: "Failed to register user",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
