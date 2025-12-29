import { NextRequest, NextResponse } from "next/server";
import { verifyTwoFactorToken, verifyBackupCode } from "@/lib/auth/two-factor";

export const dynamic = 'force-dynamic';

// POST /api/auth/2fa/verify - Verify TOTP token or backup code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, token, encryptedSecret, backupCode, encryptedBackupCodes } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Try TOTP token first
    if (token && encryptedSecret) {
      const result = await verifyTwoFactorToken(userId, token, encryptedSecret);

      if (result.success) {
        return NextResponse.json({
          success: true,
          method: "totp",
          message: "Verification successful",
        });
      }
    }

    // Try backup code
    if (backupCode && encryptedBackupCodes) {
      const result = await verifyBackupCode(userId, backupCode, encryptedBackupCodes);

      if (result.success) {
        // TODO: Mark backup code as used in database
        return NextResponse.json({
          success: true,
          method: "backup",
          usedIndex: result.usedIndex,
          message: "Backup code verified successfully",
        });
      }
    }

    return NextResponse.json(
      { error: "Invalid verification code" },
      { status: 401 }
    );
  } catch (error) {
    console.error("2FA verification error:", error);
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}
