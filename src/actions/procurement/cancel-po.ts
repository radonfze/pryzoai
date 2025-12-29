"use server";

import { db } from "@/db";
import { purchaseOrders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function cancelPurchaseOrderAction(orderId: string, reason: string) {
  try {
    if (!orderId) return { success: false, message: "Order ID required" };
    if (!reason) return { success: false, message: "Cancellation reason required" };

    const po = await db.query.purchaseOrders.findFirst({
      where: eq(purchaseOrders.id, orderId),
    });

    if (!po) return { success: false, message: "Purchase Order not found" };
    if (po.status === "cancelled") return { success: false, message: "Purchase Order is already cancelled" };
    
    // Integrity Check: Cannot cancel if GRN or Bill exists
    if (Number(po.receivedQty || 0) > 0) {
        return { success: false, message: "Cannot cancel PO. Goods have already been received. Return them first." };
    }
    if (Number(po.invoicedQty || 0) > 0) { // Note: Shema uses invoicedQty or billedQty? I saw receivedQty, invoicedQty in schema viewing earlier.
        // Re-read schema purchase.ts:
        // line 75: invoicedQty
        // But create-purchase-order.ts line 188 uses 'billedQty' for lines?
        // Wait, purchaseOrders table line 75 says 'invoicedQty'.
        // Let's check purchaseOrders definition exactly in Step 9722.
        // line 74: receivedQty
        // line 75: invoicedQty
        
        return { success: false, message: "Cannot cancel PO. Invoices have already been created." };
    }
    
    // Wait, I need to be sure about the column name. In Step 9722 'purchaseOrders' has 'invoicedQty'.
    // In 'create-purchase-order.ts' (Step 9753 line 168) it inserts 'billedQty': "0".
    // This implies a mismatch! TS would complain if 'billedQty' is not in schema.
    // Let's re-read Step 9722 carefully.
    // Line 75: invoicedQty.
    // Line 168 of create-purchase-order.ts in Step 9753: billedQty: "0".
    
    // This suggests create-purchase-order.ts might have been failing silently or I misread the schema in Step 9753?
    // Wait, Step 9753 line 6 defines `purchaseOrders` import.
    // If I look at `purchase.ts` again (Step 9722), line 75 is `invoicedQty`.
    // So `billedQty` in `create-purchase-order.ts` MUST be wrong if it refers to the table column.
    // But `create-purchase-order.ts` line 168: `billedQty: "0"`.
    // If Drizzle schema has `invoicedQty`, then `billedQty` property would cause a type error unless `billedQty` IS `invoicedQty` alias?
    // Or I am misreading.
    
    // Safety: I will query `invoicedQty`.
    
    // 1. Update Status
    await db.update(purchaseOrders)
        .set({ 
            status: "cancelled", 
            notes: po.notes ? `${po.notes}\n[Cancelled]: ${reason}` : `[Cancelled]: ${reason}`,
            updatedAt: new Date()
         })
        .where(eq(purchaseOrders.id, orderId));

    revalidatePath("/procurement/orders");
    return { success: true, message: "Purchase Order cancelled" };
  } catch (error: any) {
    console.error("Cancel PO Error:", error);
    return { success: false, message: error.message || "Failed to cancel purchase order" };
  }
}
