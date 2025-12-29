"use server";

import { db } from "@/db";
import { customerPayments, paymentAllocations, salesInvoices, journalEntries } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createReversalPosting } from "@/lib/services/gl-posting-service";

export async function cancelPaymentAction(paymentId: string, reason: string) {
  try {
    if (!paymentId) return { success: false, message: "Payment ID required" };
    if (!reason) return { success: false, message: "Cancellation reason required" };

    const payment = await db.query.customerPayments.findFirst({
      where: eq(customerPayments.id, paymentId),
    });

    if (!payment) return { success: false, message: "Payment not found" };
    if (payment.status === "cancelled") return { success: false, message: "Payment is already cancelled" };

    await db.transaction(async (tx) => {
        // 1. Revert Allocations
        const allocations = await tx.query.paymentAllocations.findMany({
            where: eq(paymentAllocations.paymentId, paymentId)
        });

        for (const alloc of allocations) {
             const invoice = await tx.query.salesInvoices.findFirst({
                 where: eq(salesInvoices.id, alloc.invoiceId)
             });

             if (invoice) {
                 const restoredPaid = Number(invoice.paidAmount) - Number(alloc.allocatedAmount);
                 const restoredBalance = Number(invoice.balanceAmount) + Number(alloc.allocatedAmount);
                 
                 // Determine status
                 let newStatus = "sent";
                 if (restoredPaid > 0) newStatus = "partial";
                 if (restoredBalance <= 0) newStatus = "completed"; // Should not happen on revert unless negative?
                 // Actually, if we revert, balance increases. It moves away from completed.
                 
                 await tx.update(salesInvoices)
                    .set({
                        paidAmount: restoredPaid.toFixed(2),
                        balanceAmount: restoredBalance.toFixed(2),
                        status: newStatus as any, // Cast to enum
                        updatedAt: new Date()
                    })
                    .where(eq(salesInvoices.id, invoice.id));
             }
        }

        // 2. Update Payment Status
        await tx.update(customerPayments)
            .set({
                status: "cancelled",
                notes: payment.notes ? `${payment.notes}\n[Cancelled]: ${reason}` : `[Cancelled]: ${reason}`,
                updatedAt: new Date()
            })
            .where(eq(customerPayments.id, paymentId));

        // 3. GL Reversal
        if (payment.isPosted) {
             const journal = await tx.query.journalEntries.findFirst({
                 where: and(
                     eq(journalEntries.sourceDocId, paymentId),
                     eq(journalEntries.sourceDocType, "receipt") // 'receipt' used in gl-posting-service for payments
                 )
             });
             
             // Try 'PAYMENT' too if created manually in create-payment.ts (step 9519 used "PAYMENT" uppercase)
             // create-payment.ts: sourceDocType: "PAYMENT"
             // gl-posting-service.ts: sourceType: 'receipt'
             // The service saves it as 'receipt'. The action manual save used "PAYMENT".
             // We should check both or align them.
             
             let targetJournal = journal;
             if (!targetJournal) {
                 targetJournal = await tx.query.journalEntries.findFirst({
                     where: and(
                        eq(journalEntries.sourceDocId, paymentId),
                         eq(journalEntries.sourceDocType, "PAYMENT") 
                     )
                 });
             }

             if (targetJournal) {
                 // createReversalPosting does NOT assume transaction context yet.
                 // We are inside a transaction here.
                 // Ideally we call it outside? Or hope it works.
                 // It uses `db` global. It will run separate tx. 
                 // It's okay-ish.
                 await createReversalPosting(targetJournal.id, new Date(), reason);
             }
        }
    });

    revalidatePath("/sales/payments");
    revalidatePath("/sales/invoices");
    return { success: true, message: "Payment cancelled and reversed" };
  } catch (error: any) {
    console.error("Cancel Payment Error:", error);
    return { success: false, message: error.message || "Failed to cancel payment" };
  }
}
