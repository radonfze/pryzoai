"use server";

import { logout } from "@/lib/auth/auth-service";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    await logout();
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Logout API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
