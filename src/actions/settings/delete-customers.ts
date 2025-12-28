"use server";

import { db } from "@/db";
import { customers, salesInvoices, salesQuotations } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function deleteCustomersAction(ids: string[]) {
  try {
    if (!ids.length) return { success: false, message: "No customers selected" };

    // Integrity: Check usage
    const hasInvoices = await db.query.salesInvoices.findFirst({
      where: inArray(salesInvoices.customerId, ids)
    });
    
    if (hasInvoices) {
      return { success: false, message: "Cannot delete customers with existing invoices." };
    }

    await db.delete(customers).where(inArray(customers.id, ids));
    revalidatePath("/settings/customers");
    return { success: true, message: `Deleted ${ids.length} customer(s)` };
  } catch (error) {
    return { success: false, message: "Failed to delete customers" };
  }
}
