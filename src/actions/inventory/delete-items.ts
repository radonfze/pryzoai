"use server";

import { db } from "@/db";
import { items, stockLedger, invoiceLines, purchaseOrderLines } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function deleteItemsAction(ids: string[]) {
  try {
    if (!ids.length) return { success: false, message: "No items selected" };

    // 1. Integrity Check: Check for usage in Stock Ledger
    const usedInLedger = await db.query.stockLedger.findFirst({
      where: inArray(stockLedger.itemId, ids)
    });

    if (usedInLedger) {
      return { success: false, message: "Cannot delete items that have stock transactions. Archive them instead." };
    }

    // 2. Perform Delete
    await db.delete(items).where(inArray(items.id, ids));

    revalidatePath("/inventory/items");
    return { success: true, message: `Successfully deleted ${ids.length} item(s)` };
  } catch (error) {
    console.error("Delete items error:", error);
    return { success: false, message: "Failed to delete items" };
  }
}
