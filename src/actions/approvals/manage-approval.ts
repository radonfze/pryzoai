"use server";

import { revalidatePath } from "next/cache";
import { ApprovalService } from "@/lib/services/approval-service";
import { InventoryService } from "@/lib/services/inventory-service";
import { getUser } from "@/lib/auth/get-user"; 
import { requirePermission } from "@/lib/auth/permissions";
import { db } from "@/db";
import { salesOrders } from "@/db/schema/sales";

import { purchaseOrders } from "@/db/schema/purchase";
import { approvalRequests } from "@/db/schema/approvals";
import { eq } from "drizzle-orm";

export async function approveDocumentAction(requestId: string, comment?: string) {
  const user = await getUser();
  if (!user) {
    return { error: "Unauthorized" };
  }
  
  // Basic permission check - ensure user can access system
  await requirePermission(user.id, "dashboard.view");

  try {
    const result = await ApprovalService.approve({
      requestId,
      userId: user.id,
      comment,
    });

    if (result.status === "APPROVED") {
      // If fully approved, we need to update the actual document status
      // This part is tricky because we need to know WHICH table to update.
      // We can fetch the request to know the doc type.
      
      const request = await db.query.approvalRequests.findFirst({
         where: eq(approvalRequests.id, requestId),
      });

      if (request) {
        if (request.documentType === "sales_order") {
          await db.update(salesOrders)
            .set({ status: "issued" })
            .where(eq(salesOrders.id, request.documentId));
          
          // Reserve Stock
          await InventoryService.reserveStockForOrder(request.documentId);
        } else if (request.documentType === "purchase_order") {
           await db.update(purchaseOrders)
            .set({ status: "issued" })
            .where(eq(purchaseOrders.id, request.documentId));
        }
      }
    }

    revalidatePath("/dashboard");
    return { success: true, status: result.status };
  } catch (error) {
    console.error("Approval error:", error);
    return { error: (error as Error).message };
  }
}
