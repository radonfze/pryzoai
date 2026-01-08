"use server";

import { db } from "@/db";
import { users, passwordResetTokens } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { authenticator } from "otplib";
import { hashPassword, unlockAccount } from "@/lib/auth/auth-service";

const OTP_VALIDITY_MINUTES = 10;

/**
 * Request an OTP to be sent to the Admin for a user password reset.
 */
export async function requestAdminOtp(email: string) {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      // Return success even if user not found to prevent enumeration
      // But for better UX in enterprise app, maybe we act honest?
      // Let's return error for now as it's an internal ERP.
      return { success: false, error: "User not found" };
    }

    // Generate 6-digit OTP
    const token = authenticator.generate(authenticator.generateSecret());

    // Store token
    await db.insert(passwordResetTokens).values({
      email,
      token,
      expiresAt: new Date(Date.now() + OTP_VALIDITY_MINUTES * 60 * 1000),
    });

    // Send Email (Simulated)
    // In production, this would use `resend` or `nodemailer` to email the ADMIN.
    // For now, we log it to console as requested/implied for non-configured envs.
    // Ideally we'd look up the Admin email from `users` table where role='admin'.
    
    // Find Admin Email
    const admins = await db.query.users.findMany({
        where: eq(users.role, "admin"),
        limit: 1
    });
    
    const adminEmail = admins[0]?.email || "admin@pryzo.com";

    // LOG TO CONSOLE
    console.log("---------------------------------------------------");
    console.log(`[PASSWORD RESET REQUEST]`);
    console.log(`User: ${email}`);
    console.log(`Admin Recipient: ${adminEmail}`);
    console.log(`OTP CODE: ${token}`);
    console.log("---------------------------------------------------");

    return { success: true, message: `OTP sent to admin email (${adminEmail}). Please contact admin.` };
  } catch (error) {
    console.error("Request OTP Error:", error);
    return { success: false, error: "Failed to request OTP" };
  }
}

/**
 * Verify if the OTP is valid.
 */
export async function verifyResetOtp(email: string, token: string) {
  try {
    const record = await db.query.passwordResetTokens.findFirst({
      where: and(
        eq(passwordResetTokens.email, email),
        eq(passwordResetTokens.token, token),
        gt(passwordResetTokens.expiresAt, new Date())
      ),
      orderBy: (tokens, { desc }) => [desc(tokens.createdAt)],
    });

    if (!record) {
      return { success: false, error: "Invalid or expired OTP" };
    }

    return { success: true };
  } catch (error) {
    console.error("Verify OTP Error:", error);
    return { success: false, error: "Verification failed" };
  }
}

/**
 * Reset the password using a valid OTP.
 */
export async function resetPassword(email: string, token: string, newPassword: string) {
  try {
    // 1. Verify OTP again
    const validation = await verifyResetOtp(email, token);
    if (!validation.success) {
      return validation;
    }

    // 2. Find User
    const user = await db.query.users.findFirst({
        where: eq(users.email, email)
    });
    
    if (!user) {
        return { success: false, error: "User not found" };
    }

    // 3. Hash New Password
    const passwordHash = await hashPassword(newPassword);

    // 4. Update Password (and unlock account just in case)
    await db.update(users)
      .set({
        passwordHash,
        failedLoginAttempts: 0,
        lockedUntil: null,
      })
      .where(eq(users.email, email));

    // 5. Delete Used Token (Optional: or mark as used. We delete for simplicity)
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.email, email));

    return { success: true, message: "Password reset successful. Please login." };
  } catch (error) {
    console.error("Reset Password Error:", error);
    return { success: false, error: "Failed to reset password" };
  }
}
