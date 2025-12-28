"use server";

import { db } from "@/db";
import { copilotPolicies, auditAiActions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCompanyId } from "@/lib/auth";

export interface GovernanceCheckResult {
    allowed: boolean;
    requiresApproval: boolean;
    reason?: string;
}

/**
 * Checks if an AI action is allowed based on company policies.
 */
export async function checkAiPolicy(
    module: string,
    action: "create" | "read" | "update" | "delete",
    value?: number
): Promise<GovernanceCheckResult> {
    try {
        const companyId = await getCompanyId();

        // 1. Fetch relevant policies
        // Prioritize specific module policies over 'all' (logic simplified here)
        const policy = await db.query.copilotPolicies.findFirst({
            where: and(
                eq(copilotPolicies.companyId, companyId),
                eq(copilotPolicies.module, module),
                eq(copilotPolicies.action, action),
                eq(copilotPolicies.isActive, true)
            )
        });

        // Default: Allow if no specific restriction found? Or Deny?
        // Safe Mode -> Default to Allow but log, unless restricted.
        if (!policy) {
            return { allowed: true, requiresApproval: false, reason: "No restriction policy found" };
        }

        // 2. Check Constraints
        if (policy.requiresApproval) {
            // Check threshold
            if (value && policy.approvalThreshold && value < Number(policy.approvalThreshold)) {
                 return { allowed: true, requiresApproval: false, reason: "Value below approval threshold" };
            }
            return { allowed: false, requiresApproval: true, reason: "Policy requires approval for this action" };
        }

        return { allowed: true, requiresApproval: false };

    } catch (e) {
        // Fail safe
        console.error("Governance Check Failed", e);
        return { allowed: false, requiresApproval: true, reason: "Governance check error" };
    }
}

/**
 * Log an AI Action for Audit
 */
export async function logAiAction(
    action: "create" | "read" | "update" | "delete",
    entity: string,
    prompt: string,
    status: "success" | "blocked" | "pending_approval",
    details?: string
) {
    const companyId = await getCompanyId();
    await db.insert(auditAiActions).values({
        companyId,
        actionType: action,
        entityType: entity,
        prompt: prompt,
        status: status,
        blockedReason: details,
        // userId linked via session context in real app
    });
}
