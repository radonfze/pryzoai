"use server";

import { db } from "@/db";
import { salesOrders, salesLines, deliveryNotes, deliveryNoteLines } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

/**
 * Update Sales Order quantities after a Delivery Note is created
 * This tracks partial deliveries and updates SO status accordingly
 */
export async function updateSalesOrderDeliveredQty(
  salesOrderId: string,
  deliveredItems: { salesOrderLineId: string; deliveredQty: number }[]
): Promise<{ success: boolean; message: string }> {
  try {
    if (!salesOrderId || !deliveredItems.length) {
      return { success: false, message: "Invalid input" };
    }

    await db.transaction(async (tx) => {
      // 1. Update each line's delivered quantity
      for (const item of deliveredItems) {
        if (!item.salesOrderLineId) continue;
        
        await tx
          .update(salesLines)
          .set({
            deliveredQty: sql`COALESCE(${salesLines.deliveredQty}, 0) + ${item.deliveredQty}`,
          })
          .where(eq(salesLines.id, item.salesOrderLineId));
      }

      // 2. Recalculate total delivered for the SO
      const lines = await tx.query.salesLines.findMany({
        where: eq(salesLines.salesOrderId, salesOrderId),
      });

      const totalOrdered = lines.reduce((sum, l) => sum + Number(l.quantity || 0), 0);
      const totalDelivered = lines.reduce((sum, l) => sum + Number(l.deliveredQty || 0), 0);

      // 3. Determine new status
      let newStatus = "issued";
      if (totalDelivered >= totalOrdered) {
        newStatus = "completed";
      } else if (totalDelivered > 0) {
        newStatus = "partial";
      }

      // 4. Update SO header
      await tx
        .update(salesOrders)
        .set({
          deliveredQty: totalDelivered.toString(),
          status: newStatus,
          updatedAt: new Date(),
        })
        .where(eq(salesOrders.id, salesOrderId));
    });

    return { success: true, message: "Sales order updated with delivery quantities" };
  } catch (error: any) {
    console.error("Update SO delivered qty error:", error);
    return { success: false, message: error.message };
  }
}

/**
 * Update Sales Order quantities after an Invoice is created
 */
export async function updateSalesOrderInvoicedQty(
  salesOrderId: string,
  invoicedItems: { salesOrderLineId: string; invoicedQty: number }[]
): Promise<{ success: boolean; message: string }> {
  try {
    if (!salesOrderId || !invoicedItems.length) {
      return { success: false, message: "Invalid input" };
    }

    await db.transaction(async (tx) => {
      // 1. Update each line's invoiced quantity
      for (const item of invoicedItems) {
        if (!item.salesOrderLineId) continue;
        
        await tx
          .update(salesLines)
          .set({
            invoicedQty: sql`COALESCE(${salesLines.invoicedQty}, 0) + ${item.invoicedQty}`,
          })
          .where(eq(salesLines.id, item.salesOrderLineId));
      }

      // 2. Recalculate total invoiced for the SO
      const lines = await tx.query.salesLines.findMany({
        where: eq(salesLines.salesOrderId, salesOrderId),
      });

      const totalInvoiced = lines.reduce((sum, l) => sum + Number(l.invoicedQty || 0), 0);

      // 3. Update SO header
      await tx
        .update(salesOrders)
        .set({
          invoicedQty: totalInvoiced.toString(),
          updatedAt: new Date(),
        })
        .where(eq(salesOrders.id, salesOrderId));
    });

    return { success: true, message: "Sales order updated with invoiced quantities" };
  } catch (error: any) {
    console.error("Update SO invoiced qty error:", error);
    return { success: false, message: error.message };
  }
}
