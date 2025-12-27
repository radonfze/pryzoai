import { authenticator } from "otplib";
import * as QRCode from "qrcode";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const APP_NAME = "PryzoAI";

// Encrypt secret for storage
function encryptSecret(secret: string): string {
  const key = process.env.TOTP_ENCRYPTION_KEY || "pryzoai-default-key-32chars!!";
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(key.padEnd(32).slice(0, 32)), iv);
  let encrypted = cipher.update(secret, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

// Decrypt secret from storage
function decryptSecret(encryptedSecret: string): string {
  const key = process.env.TOTP_ENCRYPTION_KEY || "pryzoai-default-key-32chars!!";
  const [ivHex, encrypted] = encryptedSecret.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(key.padEnd(32).slice(0, 32)), iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export interface TwoFactorSetupResult {
  secret: string;
  qrCodeDataUrl: string;
  backupCodes: string[];
}

/**
 * Generate a new TOTP secret and QR code for user setup
 */
export async function generateTwoFactorSecret(
  userId: string,
  userEmail: string
): Promise<TwoFactorSetupResult> {
  // Generate secret
  const secret = authenticator.generateSecret();

  // Generate QR code URL
  const otpauthUrl = authenticator.keyuri(userEmail, APP_NAME, secret);
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

  // Generate backup codes
  const backupCodes = Array.from({ length: 8 }, () =>
    crypto.randomBytes(4).toString("hex").toUpperCase()
  );

  return {
    secret,
    qrCodeDataUrl,
    backupCodes,
  };
}

/**
 * Enable 2FA for a user after they verify the token
 */
export async function enableTwoFactor(
  userId: string,
  secret: string,
  token: string,
  backupCodes: string[]
): Promise<{ success: boolean; error?: string }> {
  // Verify the token first
  const isValid = authenticator.verify({ token, secret });

  if (!isValid) {
    return { success: false, error: "Invalid verification code" };
  }

  // Encrypt and store the secret
  const encryptedSecret = encryptSecret(secret);
  const encryptedBackupCodes = backupCodes.map((code) => encryptSecret(code));

  // Update user record
  await db
    .update(users)
    .set({
      isTwoFactorEnabled: true,
      // Store in user metadata or separate table
      // For now, we'll update the flag only
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  // TODO: Store encrypted secret and backup codes in user_two_factor table

  return { success: true };
}

/**
 * Verify a TOTP token for a user
 */
export async function verifyTwoFactorToken(
  userId: string,
  token: string,
  encryptedSecret: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const secret = decryptSecret(encryptedSecret);
    const isValid = authenticator.verify({ token, secret });

    if (!isValid) {
      return { success: false, error: "Invalid verification code" };
    }

    return { success: true };
  } catch (error) {
    console.error("2FA verification error:", error);
    return { success: false, error: "Verification failed" };
  }
}

/**
 * Verify a backup code
 */
export async function verifyBackupCode(
  userId: string,
  code: string,
  encryptedBackupCodes: string[]
): Promise<{ success: boolean; usedIndex?: number; error?: string }> {
  for (let i = 0; i < encryptedBackupCodes.length; i++) {
    try {
      const decryptedCode = decryptSecret(encryptedBackupCodes[i]);
      if (decryptedCode === code.toUpperCase()) {
        return { success: true, usedIndex: i };
      }
    } catch {
      // Skip invalid codes
    }
  }

  return { success: false, error: "Invalid backup code" };
}

/**
 * Disable 2FA for a user
 */
export async function disableTwoFactor(
  userId: string,
  token: string,
  encryptedSecret: string
): Promise<{ success: boolean; error?: string }> {
  // Verify token before disabling
  const verification = await verifyTwoFactorToken(userId, token, encryptedSecret);

  if (!verification.success) {
    return verification;
  }

  // Update user record
  await db
    .update(users)
    .set({
      isTwoFactorEnabled: false,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  // TODO: Remove encrypted secret and backup codes

  return { success: true };
}
