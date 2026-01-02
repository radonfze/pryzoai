import { db } from "@/db";
import { auditLogs, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCompanyId, getUserId } from "@/lib/auth";
import crypto from "crypto";

type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "CANCEL" | "APPROVE" | "REJECT" | "LOGIN" | "LOGOUT";

interface AuditLogParams {
  entityType: string;
  entityId: string;
  action: AuditAction;
  beforeValue?: any;
  afterValue?: any;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Creates an immutable audit log entry with hash chaining
 */
export async function logAuditAction(params: AuditLogParams) {
  try {
    const companyId = await getCompanyId();
    const userId = await getUserId();
    
    // 1. Fetch previous log for hash chaining (integrity check)
    // We get the most recent log for this company to chain it
    const lastLog = await db.query.auditLogs.findFirst({
      where: eq(auditLogs.companyId, companyId),
      orderBy: (logs, { desc }) => [desc(logs.createdAt)],
    });

    const previousHash = lastLog?.currentHash || "GENESIS_HASH";

    // 2. Prepare payload for hashing
    const timestamp = new Date().toISOString();
    const payload = JSON.stringify({
      companyId,
      userId,
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      before: params.beforeValue,
      after: params.afterValue,
      prev: previousHash,
      ts: timestamp
    });

    // 3. Generate SHA-256 Hash
    const currentHash = crypto.createHash('sha256').update(payload).digest('hex');

    // 4. Insert Log
    await db.insert(auditLogs).values({
      companyId,
      userId,
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      beforeValue: params.beforeValue,
      afterValue: params.afterValue,
      reason: params.reason,
      ipAddress: params.ipAddress || "unknown",
      userAgent: params.userAgent || "server-action",
      previousHash,
      currentHash,
    });

  } catch (error) {
    // Audit logging should essentially never fail the main transaction, 
    // but in a high-security env, we might want to throw.
    // For now, we log to console so operation succeeds even if log fails, unless strict mode requested.
    console.error("AUDIT LOG FAILURE:", error);
  }
}
