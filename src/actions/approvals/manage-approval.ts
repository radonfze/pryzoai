"use server";

import { db } from "@/db";
import { approvalRequests, approvalActions, salesInvoices } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCompanyId, getUserId, requirePermission } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { postSalesInvoiceToGL } from "@/lib/services/gl-posting-service";
import { createStockMovement } from "@/lib/services/inventory-movement-service";

/**
 * Approve or Reject a Request
 */
export async function manageApprovalRequest(
  requestId: string,
  action: "APPROVE" | "REJECT",
  comments?: string
) {
  try {
    const companyId = await getCompanyId();
    const userId = await getUserId();
    
    // 1. Permission Check (General 'approve' permission for now, ideally granular by rule)
    // For MVP, we assume anyone with 'approvals.manage' can approve anything. 
    // In real world, we check `approvalSteps` to see if THIS user is the approver.
    await requirePermission("dashboard.view"); // Minimal check, assuming UI filters correctly for now.
    
    return await db.transaction(async (tx) => {
        // 2. Fetch Request
        const request = await tx.query.approvalRequests.findFirst({
            where: eq(approvalRequests.id, requestId)
        });

        if (!request || request.status !== "PENDING") {
             return { success: false, message: "Request not pending or not found" };
        }

        // 3. Log Action
        await tx.insert(approvalActions).values({
            requestId,
            action,
            actionBy: userId,
            comments,
            actionAt: new Date()
        });

        // 4. Handle Rejection
        if (action === "REJECT") {
            await tx.update(approvalRequests)
                .set({ status: "REJECTED", completedAt: new Date() })
                .where(eq(approvalRequests.id, requestId));
            
            // Revert Document Status
            if (request.documentType === "invoice") {
                await tx.update(salesInvoices)
                    .set({ status: "draft" }) // Send back to draft
                    .where(eq(salesInvoices.id, request.documentId));
            }
            
            revalidatePath("/approvals");
            return { success: true, message: "Request Rejected" };
        }

        // 5. Handle Approval
        if (action === "APPROVE") {
            // Check if there are more steps? For MVP, Assume Single Step Approval
            const isFinalApproval = true; 

            if (isFinalApproval) {
                await tx.update(approvalRequests)
                    .set({ status: "APPROVED", completedAt: new Date() })
                    .where(eq(approvalRequests.id, requestId));

                // EXECUTE BUSINESS LOGIC (Post Invoice, etc.)
                if (request.documentType === "invoice") {
                    // Update Invoice Status
                    await tx.update(salesInvoices)
                        .set({ status: "approved" }) // Ready for Posting or Auto-Post
                        .where(eq(salesInvoices.id, request.documentId));
                    
                    // Optional: Auto-Post on Approval?
                    // Let's leave it as 'Approved' so Finance can manually 'Post' (Segregation of Duties)
                    // Or we can simple mark it 'issued'.
                    // Let's set it to 'issued' (Open).
                    await tx.update(salesInvoices)
                        .set({ status: "issued" })
                        .where(eq(salesInvoices.id, request.documentId));
                }
            } else {
                // Increment Step
                // await tx.update(approvalRequests).set({ currentStep: request.currentStep + 1 })...
            }

            revalidatePath("/approvals");
            return { success: true, message: "Request Approved" };
        }
    });

  } catch (error: any) {
    console.error("Approval Error:", error);
    return { success: false, message: error.message };
  }
}
