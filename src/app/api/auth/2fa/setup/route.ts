import { NextRequest, NextResponse } from "next/server";
import { generateTwoFactorSecret, enableTwoFactor } from "@/lib/auth/two-factor";

// POST /api/auth/2fa/setup - Generate 2FA secret and QR code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email } = body;

    if (!userId || !email) {
      return NextResponse.json(
        { error: "userId and email are required" },
        { status: 400 }
      );
    }

    const result = await generateTwoFactorSecret(userId, email);

    return NextResponse.json({
      success: true,
      data: {
        qrCodeDataUrl: result.qrCodeDataUrl,
        secret: result.secret, // Only shown once during setup
        backupCodes: result.backupCodes, // Only shown once
      },
    });
  } catch (error) {
    console.error("2FA setup error:", error);
    return NextResponse.json(
      { error: "Failed to generate 2FA secret" },
      { status: 500 }
    );
  }
}

// PUT /api/auth/2fa/setup - Enable 2FA after verification
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, secret, token, backupCodes } = body;

    if (!userId || !secret || !token || !backupCodes) {
      return NextResponse.json(
        { error: "userId, secret, token, and backupCodes are required" },
        { status: 400 }
      );
    }

    const result = await enableTwoFactor(userId, secret, token, backupCodes);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Two-factor authentication enabled successfully",
    });
  } catch (error) {
    console.error("2FA enable error:", error);
    return NextResponse.json(
      { error: "Failed to enable 2FA" },
      { status: 500 }
    );
  }
}
