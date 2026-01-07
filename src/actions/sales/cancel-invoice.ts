"use server";

import { db } from "@/db";
import { salesInvoices, journalEntries, salesLines } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createReversalPosting } from "@/lib/services/gl-posting-service";
import { createStockMovement } from "@/lib/services/inventory-movement-service";
import { getCompanyId } from "@/lib/auth";

export async function cancelInvoiceAction(invoiceId: string, reason: string) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return { success: false, message: "Unauthorized" };

    if (!invoiceId) return { success: false, message: "Invoice ID required" };
    if (!reason) return { success: false, message: "Cancellation reason required" };

    // 1. Fetch Invoice
    const invoice = await db.query.salesInvoices.findFirst({
      where: eq(salesInvoices.id, invoiceId),
      with: {
        lines: true
      }
    });

    if (!invoice) return { success: false, message: "Invoice not found" };
    if (invoice.status === "cancelled") return { success: false, message: "Invoice is already cancelled" };
    if (Number(invoice.paidAmount || 0) > 0) {
        return { success: false, message: "Cannot cancel invoice with receiving payments. Please cancel payments first." };
    }

    await db.transaction(async (tx) => {
        // 2. Reverse GL if Posted
        if (invoice.isPosted) {
             const journal = await tx.query.journalEntries.findFirst({
                 where: and(
                     eq(journalEntries.sourceDocId, invoiceId),
                     eq(journalEntries.sourceDocType, "SALES_INVOICE") 
                 )
             });

             if (journal) {
                 const result = await createReversalPosting(journal.id, new Date(), reason, tx);
                 if (!result.success) {
                     throw new Error(`GL Reversal Failed: ${result.error}`);
                 }
             }

             // 3. Reverse Stock (Return items to inventory)
             // We iterate lines and add stock back
             for (const line of invoice.lines) {
                 await createStockMovement({
                    transactionType: "return_in", // Sales return / Cancellation adds stock
                    companyId,
                    warehouseId: invoice.warehouseId || "", // Assuming warehouse on header
                    itemId: line.itemId || "",
                    quantity: Number(line.quantity),
                    uom: line.uom,
                    documentType: "RET", // Using RET for reversal/return
                    documentId: invoice.id,
                    documentNumber: invoice.invoiceNumber,
                    notes: `Invoice Cancellation: ${reason}`,
                    tx
                 });
             }
        }

        // 4. Update Status
        await tx.update(salesInvoices)
            .set({ 
                status: "cancelled", 
                notes: invoice.notes ? `${invoice.notes}\n[Cancelled]: ${reason}` : `[Cancelled]: ${reason}`,
                updatedAt: new Date()
            })
            .where(eq(salesInvoices.id, invoiceId));
    });

    revalidatePath("/sales/invoices");
    return { success: true, message: "Invoice cancelled successfully" };
  } catch (error: any) {
    console.error("Cancel Invoice Error:", error);
    return { success: false, message: error.message || "Failed to cancel invoice" };
  }
}
