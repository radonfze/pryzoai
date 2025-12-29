"use server";

import { db } from "@/db";
import { journalEntries, approvalRequests, approvalRules } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getCompanyId } from "@/lib/auth";

export async function submitJournalForApproval(journalId: string, userId: string): Promise<{ success: boolean; message: string }> {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return { success: false, message: "Unauthorized" }; 

    const journal = await db.query.journalEntries.findFirst({
        where: eq(journalEntries.id, journalId)
    });

    if (!journal) return { success: false, message: "Journal not found" };
    if (journal.status !== "draft") return { success: false, message: "Only draft journals can be submitted" };

    const rule = await db.query.approvalRules.findFirst({
        where: and(
            eq(approvalRules.companyId, companyId),
            eq(approvalRules.documentType, "journal"),
            eq(approvalRules.isActive, true)
        )
    });

    if (!rule) {
        // Auto-post if no rule? Or just valid?
        // Let's set to 'posted' directly if no rule, assuming user has permission.
        await db.update(journalEntries)
            .set({ status: "posted", updatedAt: new Date() }) 
            .where(eq(journalEntries.id, journalId));
        
        revalidatePath("/finance/journals");
        return { success: true, message: "Journal posted (No approval rules found)" };
    }

    await db.transaction(async (tx) => {
        await tx.insert(approvalRequests).values({
            companyId,
            documentType: "journal",
            documentId: journalId,
            documentNumber: journal.journalNumber,
            ruleId: rule.id,
            requestedBy: userId,
            status: "PENDING",
            currentStep: 1,
            requestedAt: new Date()
        });

        await tx.update(journalEntries)
            .set({ status: "pending_approval", updatedAt: new Date() })
            .where(eq(journalEntries.id, journalId));
    });

    revalidatePath("/finance/journals");
    return { success: true, message: "Journal submitted for approval" };

  } catch (error: any) {
    console.error("Submit Journal Error:", error);
    return { success: false, message: "Failed to submit journal" };
  }
}
