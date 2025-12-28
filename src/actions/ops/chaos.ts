"use server";

import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { getCompanyId } from "@/lib/auth";

/**
 * CHAOS MODE: Simulates system stress.
 * WARNING: DO NOT RUN IN PRODUCTION WITH REAL DATA.
 */
export async function runChaosTest(intensity: "low" | "medium" | "high") {
    const logs = [];
    const companyId = await getCompanyId();
    const count = intensity === "low" ? 10 : intensity === "medium" ? 50 : 200;

    logs.push(`Starting Chaos Test (Intensity: ${intensity}, Requests: ${count})`);

    try {
        // 1. Simulate Rapid Concurrent Writes (Audit Logs as target)
        const promises = [];
        for (let i = 0; i < count; i++) {
            promises.push(
                db.insert(auditLogs).values({
                    companyId,
                    action: "CHAOS_TEST",
                    entity: "system",
                    details: `Stress Test Entry ${i}`,
                    ipAddress: "127.0.0.1"
                }).then(() => `Request ${i}: Success`)
                  .catch((e) => `Request ${i}: Failed - ${e.message}`)
            );
        }

        const results = await Promise.all(promises);
        const failures = results.filter(r => r.includes("Failed"));
        
        logs.push(`Completed. Success: ${count - failures.length}, Failures: ${failures.length}`);
        
        if (failures.length > 0) {
            logs.push(`Sample Failure: ${failures[0]}`);
        }

        return { success: true, logs };

    } catch (e: any) {
        return { success: false, error: e.message, logs };
    }
}
