

import { login } from "@/lib/auth/auth-service";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Get IP and user agent for audit
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ipAddress = forwardedFor?.split(",")[0]?.trim() || 
                     request.headers.get("x-real-ip") || 
                     "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Attempt login
    const result = await login(email, password, ipAddress, userAgent);

    if (!result.success) {
      return NextResponse.json(result, { status: 401 });
    }

    // Session cookie is set by auth-service
    return NextResponse.json(result);

  } catch (error: any) {
    console.error("[Login API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
