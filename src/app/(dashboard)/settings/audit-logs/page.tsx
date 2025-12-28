import { db } from "@/db";
import { auditLogs, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { AuditLogViewer } from "@/components/admin/audit-log-viewer"; // Already created in Phase 15
import { getCompanyId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AuditLogsPage() {
  const companyId = await getCompanyId();

  // Fetch recent logs
  const logs = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      resourceType: auditLogs.entityType,
      resourceId: auditLogs.entityId,
      changes: auditLogs.changes,
      metadata: auditLogs.metadata,
      createdAt: auditLogs.createdAt,
      userName: users.name,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id))
    .where(eq(auditLogs.companyId, companyId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(50);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">System Audit Logs</h1>
      </div>
      
      <AuditLogViewer logs={logs} />
    </div>
  );
}
