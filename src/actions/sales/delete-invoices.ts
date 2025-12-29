"use server";

import { db } from "@/db";
import { salesInvoices, salesLines } from "@/db/schema";
import { eq, inArray, and, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function deleteInvoicesAction(ids: string[]) {
  try {
    if (!ids.length) return { success: false, message: "No invoices selected" };

    // Integrity: Only Draft
    const nonDraft = await db.query.salesInvoices.findFirst({
      where: and(
        inArray(salesInvoices.id, ids),
        ne(salesInvoices.status, "draft")
      )
    });

    if (nonDraft) {
      return { success: false, message: "Only Draft invoices can be deleted" };
    }

    await db.delete(salesLines).where(inArray(salesLines.invoiceId, ids));
    await db.delete(salesInvoices).where(inArray(salesInvoices.id, ids));

    revalidatePath("/sales/invoices");
    return { success: true, message: `Deleted ${ids.length} invoice(s)` };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Failed to delete invoices" };
  }
}
