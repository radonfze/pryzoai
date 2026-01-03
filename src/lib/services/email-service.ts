"use server";

import { Resend } from "resend";

// Check if Resend is configured
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface SendOtpEmailParams {
  to: string;
  otpCode: string;
  purpose: string;
  itemName?: string;
  expiresInMinutes?: number;
}

/**
 * Send OTP via email using Resend
 * Falls back gracefully if Resend is not configured
 */
export async function sendOtpEmail({
  to,
  otpCode,
  purpose,
  itemName,
  expiresInMinutes = 5,
}: SendOtpEmailParams): Promise<{ success: boolean; error?: string; fallback?: boolean }> {
  // If Resend not configured, return fallback
  if (!resend) {
    console.log(`[OTP-EMAIL] Resend not configured. OTP for ${to}: ${otpCode}`);
    return { success: true, fallback: true };
  }

  const purposeText = {
    delete_master: "Delete Confirmation",
    reset_edit_password: "Reset Edit Password",
    cancel_document: "Cancel Document",
    admin_override: "Admin Override",
  }[purpose] || "Verification";

  try {
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "PryzoAI ERP <noreply@pryzo.com>",
      to: [to],
      subject: `${purposeText} - Your OTP Code`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🔐 PryzoAI ERP</h1>
          </div>
          
          <h2 style="color: #333; text-align: center;">${purposeText}</h2>
          
          ${itemName ? `<p style="color: #666; text-align: center;">You are about to delete: <strong>${itemName}</strong></p>` : ""}
          
          <div style="background: #f5f5f5; padding: 30px; border-radius: 12px; text-align: center; margin: 20px 0;">
            <p style="color: #666; margin: 0 0 10px 0; font-size: 14px;">Your One-Time Password</p>
            <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #333; font-family: monospace;">
              ${otpCode}
            </div>
            <p style="color: #999; margin: 15px 0 0 0; font-size: 12px;">
              Valid for ${expiresInMinutes} minutes
            </p>
          </div>
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            If you didn't request this code, please ignore this email or contact your administrator.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("[OTP-EMAIL] Resend error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("[OTP-EMAIL] Send error:", err);
    return { success: false, error: "Failed to send email" };
  }
}

/**
 * Check if email service is configured
 */
export async function isEmailConfigured(): Promise<boolean> {
  return !!process.env.RESEND_API_KEY;
}
