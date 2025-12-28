"use server";

import { db } from "@/db";
import { suppliers, purchaseOrders, purchaseInvoices } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function deleteSuppliersAction(ids: string[]) {
  try {
    if (!ids.length) return { success: false, message: "No suppliers selected" };

    // Integrity: Check usage
    const hasOrders = await db.query.purchaseOrders.findFirst({
      where: inArray(purchaseOrders.supplierId, ids)
    });
    
    if (hasOrders) {
      return { success: false, message: "Cannot delete suppliers with existing orders." };
    }

    await db.delete(suppliers).where(inArray(suppliers.id, ids));
    revalidatePath("/settings/suppliers");
    return { success: true, message: `Deleted ${ids.length} supplier(s)` };
  } catch (error) {
    return { success: false, message: "Failed to delete suppliers" };
  }
}
