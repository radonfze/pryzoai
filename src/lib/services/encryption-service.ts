import "server-only";
import crypto from "crypto";

// Ideally this comes from process.env.ENCRYPTION_KEY
// Fallback for dev only. In prod, this MUST be a 32-byte hex string in env.
const SECRET_KEY = process.env.ENCRYPTION_KEY || "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff"; // 32 bytes
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // For AES, this is always 16 for GCM? Actually GCM recommended IV is 12 bytes (96 bits) generally, but let's standardise.
// Correction: AES-GCM standard IV is 12 bytes (96 bits).

/**
 * Encrypts a sensitive string (PII, Salary, etc)
 * @param text Clear text
 * @returns format: "iv:authTag:encryptedText" (hex encoded)
 */
export function encryptData(text: string): string {
  if (!text) return text;
  
  // Ensure Key is buffer
  const key = Buffer.from(SECRET_KEY, 'hex');
  if (key.length !== 32) throw new Error("Invalid ENCRYPTION_KEY length. Must be 32 bytes hex.");

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a sensitive string
 * @param encryptedText format: "iv:authTag:encryptedText"
 * @returns Clear text
 */
export function decryptData(encryptedText: string): string {
  if (!encryptedText || !encryptedText.includes(":")) return encryptedText;

  const [ivHex, authTagHex, contentHex] = encryptedText.split(":");
  if (!ivHex || !authTagHex || !contentHex) return encryptedText;

  const key = Buffer.from(SECRET_KEY, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(contentHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
