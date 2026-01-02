"use server";

import { db } from "@/db";
import { otpVerifications, editPasswordLogs } from "@/db/schema";
import { users } from "@/db/schema/users";
import { eq, and, gt } from "drizzle-orm";
import bcrypt from "bcryptjs";

const OTP_EXPIRY_MINUTES = 5;

/**
 * Generate a 6-digit OTP code
 */
function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Create and store OTP for a user
 */
export async function generateOtp(
  userId: string,
  purpose: "delete_master" | "reset_edit_password" | "cancel_document" | "admin_override",
  targetTable?: string,
  targetId?: string
): Promise<{ success: boolean; otpId?: string; expiresAt?: Date; error?: string }> {
  try {
    const otpCode = generateOtpCode();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    const [otp] = await db
      .insert(otpVerifications)
      .values({
        userId,
        otpCode,
        purpose,
        targetTable,
        targetId,
        expiresAt,
      })
      .returning();

    // In production: Send via email/SMS
    // For development: Log to console
    console.log(`[OTP] Code for user ${userId}: ${otpCode} (expires: ${expiresAt})`);

    return {
      success: true,
      otpId: otp.id,
      expiresAt,
    };
  } catch (error) {
    console.error("[OTP] Generate error:", error);
    return { success: false, error: "Failed to generate OTP" };
  }
}

/**
 * Verify an OTP code
 */
export async function verifyOtp(
  userId: string,
  otpCode: string,
  purpose: "delete_master" | "reset_edit_password" | "cancel_document" | "admin_override"
): Promise<{ success: boolean; otpId?: string; error?: string }> {
  try {
    const now = new Date();

    // Find valid OTP
    const otp = await db.query.otpVerifications.findFirst({
      where: and(
        eq(otpVerifications.userId, userId),
        eq(otpVerifications.otpCode, otpCode),
        eq(otpVerifications.purpose, purpose),
        gt(otpVerifications.expiresAt, now)
      ),
    });

    if (!otp) {
      return { success: false, error: "Invalid or expired OTP" };
    }

    if (otp.verifiedAt) {
      return { success: false, error: "OTP already used" };
    }

    // Mark as verified
    await db
      .update(otpVerifications)
      .set({ verifiedAt: now })
      .where(eq(otpVerifications.id, otp.id));

    return { success: true, otpId: otp.id };
  } catch (error) {
    console.error("[OTP] Verify error:", error);
    return { success: false, error: "OTP verification failed" };
  }
}

/**
 * Set or update edit password for a user
 */
export async function setEditPassword(
  userId: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (newPassword.length < 6) {
      return { success: false, error: "Edit password must be at least 6 characters" };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db
      .update(users)
      .set({
        editPasswordHash: hashedPassword,
        editPasswordSetAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return { success: true };
  } catch (error) {
    console.error("[EditPassword] Set error:", error);
    return { success: false, error: "Failed to set edit password" };
  }
}

/**
 * Verify edit password for a user
 */
export async function verifyEditPassword(
  userId: string,
  password: string,
  action: string,
  targetTable: string,
  targetId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        editPasswordHash: true,
      },
    });

    if (!user?.editPasswordHash) {
      return { success: false, error: "Edit password not set. Please set it in your profile." };
    }

    const isValid = await bcrypt.compare(password, user.editPasswordHash);

    // Log the attempt
    await db.insert(editPasswordLogs).values({
      userId,
      action,
      targetTable,
      targetId,
      success: isValid ? "true" : "false",
      ipAddress,
      userAgent,
    });

    if (!isValid) {
      return { success: false, error: "Incorrect edit password" };
    }

    return { success: true };
  } catch (error) {
    console.error("[EditPassword] Verify error:", error);
    return { success: false, error: "Verification failed" };
  }
}

/**
 * Check if user has edit password set
 */
export async function hasEditPasswordSet(userId: string): Promise<boolean> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        editPasswordHash: true,
      },
    });

    return !!user?.editPasswordHash;
  } catch {
    return false;
  }
}

/**
 * Cleanup expired OTPs (housekeeping)
 */
export async function cleanupExpiredOtps(): Promise<number> {
  try {
    const result = await db
      .delete(otpVerifications)
      .where(gt(new Date(), otpVerifications.expiresAt));
    
    return 0; // Drizzle doesn't return count easily
  } catch (error) {
    console.error("[OTP] Cleanup error:", error);
    return 0;
  }
}
