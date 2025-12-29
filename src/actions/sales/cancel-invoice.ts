"use server";

import { db } from "@/db";
import { salesInvoices, journalEntries } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createReversalPosting } from "@/lib/services/gl-posting-service";

export async function cancelInvoiceAction(invoiceId: string, reason: string) {
  try {
    if (!invoiceId) return { success: false, message: "Invoice ID required" };
    if (!reason) return { success: false, message: "Cancellation reason required" };

    const invoice = await db.query.salesInvoices.findFirst({
      where: eq(salesInvoices.id, invoiceId),
    });

    if (!invoice) return { success: false, message: "Invoice not found" };
    if (invoice.status === "cancelled") return { success: false, message: "Invoice is already cancelled" };
    
    // Integrity Check: Cannot cancel if payments exist (paid > 0)
    // In a full system, you'd unallocate payments first. Here we enforce manual unallocation/cancellation of payments.
    if (Number(invoice.paidAmount || 0) > 0) {
        return { success: false, message: "Cannot cancel invoice with payments. Please cancel/remove payments first." };
    }

    // 1. Update Status
    await db.update(salesInvoices)
        .set({ 
            status: "cancelled", 
            notes: invoice.notes ? `${invoice.notes}\n[Cancelled]: ${reason}` : `[Cancelled]: ${reason}`,
            updatedAt: new Date()
         })
        .where(eq(salesInvoices.id, invoiceId));

    // 2. GL Reversal
    if (invoice.isPosted) {
         // Find original journal
         const journal = await db.query.journalEntries.findFirst({
             where: and(
                 eq(journalEntries.sourceDocId, invoiceId),
                 eq(journalEntries.sourceDocType, "sales_invoice") 
             )
         });

         if (journal) {
             const result = await createReversalPosting(journal.id, new Date(), reason);
             if (!result.success) {
                 console.error("GL Reversal Failed for Invoice Cancel:", result.error);
                 // We don't rollback status, but we log it. User might need manual intervention.
             }
         } else {
             console.warn("Invoice was posted but no Journal Found to reverse:", invoiceId);
         }
    }

    revalidatePath("/sales/invoices");
    return { success: true, message: "Invoice cancelled and reversed" };
  } catch (error: any) {
    console.error("Cancel Invoice Error:", error);
    return { success: false, message: error.message || "Failed to cancel invoice" };
  }
}
