import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import crypto from "crypto";

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "CANCEL"
  | "APPROVE"
  | "REJECT"
  | "LOGIN"
  | "LOGOUT";

interface AuditLogEntry {
  companyId: string;
  userId?: string;
  entityType: string;
  entityId?: string;
  action: AuditAction;
  beforeValue?: Record<string, unknown>;
  afterValue?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  reason?: string;
}

/**
 * Create a SHA-256 hash of the audit log entry for tamper detection
 */
function createAuditHash(
  previousHash: string | null,
  entry: AuditLogEntry,
  timestamp: Date
): string {
  const data = JSON.stringify({
    previousHash,
    ...entry,
    timestamp: timestamp.toISOString(),
  });
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Get the hash of the last audit log entry for the company
 */
async function getLastHash(companyId: string): Promise<string | null> {
  const result = await db
    .select({ currentHash: auditLogs.currentHash })
    .from(auditLogs)
    .where(eq(auditLogs.companyId, companyId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(1);

  return result[0]?.currentHash ?? null;
}

/**
 * Create an immutable, hash-chained audit log entry
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<string> {
  const timestamp = new Date();
  
  // Get the previous hash for chain integrity
  const previousHash = await getLastHash(entry.companyId);
  
  // Create the current hash
  const currentHash = createAuditHash(previousHash, entry, timestamp);

  // Insert the audit log
  const result = await db
    .insert(auditLogs)
    .values({
      companyId: entry.companyId,
      userId: entry.userId,
      entityType: entry.entityType,
      entityId: entry.entityId,
      action: entry.action,
      beforeValue: entry.beforeValue,
      afterValue: entry.afterValue,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      reason: entry.reason,
      previousHash,
      currentHash,
      createdAt: timestamp,
    })
    .returning({ id: auditLogs.id });

  return result[0].id;
}

/**
 * Verify the integrity of the audit chain for a company
 */
export async function verifyAuditChain(companyId: string): Promise<{
  isValid: boolean;
  totalEntries: number;
  invalidEntries: string[];
}> {
  const entries = await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.companyId, companyId))
    .orderBy(asc(auditLogs.createdAt));

  const invalidEntries: string[] = [];
  let previousHash: string | null = null;

  for (const entry of entries) {
    // Recreate the hash
    const expectedHash = createAuditHash(
      previousHash,
      {
        companyId: entry.companyId,
        userId: entry.userId ?? undefined,
        entityType: entry.entityType,
        entityId: entry.entityId ?? undefined,
        action: entry.action as AuditAction,
        beforeValue: entry.beforeValue as Record<string, unknown> | undefined,
        afterValue: entry.afterValue as Record<string, unknown> | undefined,
        ipAddress: entry.ipAddress ?? undefined,
        userAgent: entry.userAgent ?? undefined,
        reason: entry.reason ?? undefined,
      },
      entry.createdAt
    );

    // Check if stored previousHash matches expected
    if (entry.previousHash !== previousHash) {
      invalidEntries.push(entry.id);
    }

    // Check if current hash is valid
    if (entry.currentHash !== expectedHash) {
      invalidEntries.push(entry.id);
    }

    previousHash = entry.currentHash;
  }

  return {
    isValid: invalidEntries.length === 0,
    totalEntries: entries.length,
    invalidEntries: [...new Set(invalidEntries)],
  };
}

/**
 * Helper to create audit log for entity changes
 */
export async function auditEntityChange<T extends Record<string, unknown>>(
  companyId: string,
  userId: string,
  entityType: string,
  entityId: string,
  action: AuditAction,
  before: T | null,
  after: T | null,
  request?: { ip?: string; headers?: { "user-agent"?: string } }
): Promise<string> {
  return createAuditLog({
    companyId,
    userId,
    entityType,
    entityId,
    action,
    beforeValue: before ?? undefined,
    afterValue: after ?? undefined,
    ipAddress: request?.ip,
    userAgent: request?.headers?.["user-agent"],
  });
}
