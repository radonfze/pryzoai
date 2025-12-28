"use server";

import { db } from "@/db";
import { auditLogs, users } from "@/db/schema"; // Assuming auditLogs schema exists
import { eq, desc } from "drizzle-orm";
import { getCompanyId } from "@/lib/auth";

export async function exportAuditLogs() {
    try {
        const companyId = await getCompanyId();
        
        // Fetch logs
        const logs = await db.query.auditLogs.findMany({
            where: eq(auditLogs.companyId, companyId),
            orderBy: [desc(auditLogs.createdAt)],
            with: {
                user: true // assuming relation
            },
            limit: 1000 // Cap for export
        });

        if (logs.length === 0) {
             return { success: false, message: "No logs found to export." };
        }

        // Convert to CSV
        // Header
        const header = "Date,User,Action,Entity,Entity ID,Details,IP Address\n";
        
        const rows = logs.map(log => {
             const date = new Date(log.createdAt).toISOString();
             const user = log.user?.name || "System";
             const action = log.action;
             const entity = log.entityType;
             const entityId = log.entityId;
             const details = `"${(log.details || "").replace(/"/g, '""')}"`; // Escape quotes
             const ip = log.ipAddress || "";
             
             return `${date},${user},${action},${entity},${entityId},${details},${ip}`;
        }).join("\n");

        return {
            success: true,
            fileName: `AuditLogs_${companyId}_${Date.now()}.csv`,
            content: header + rows
        };

    } catch (e: any) {
        return { success: false, message: e.message };
    }
}
