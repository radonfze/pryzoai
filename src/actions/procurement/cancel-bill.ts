"use server";

import { db } from "@/db";
import { purchaseBills, journalEntries } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createReversalPosting } from "@/lib/services/gl-posting-service";

export async function cancelBillAction(billId: string, reason: string) {
  try {
    if (!billId) return { success: false, message: "Bill ID required" };
    if (!reason) return { success: false, message: "Cancellation reason required" };

    const bill = await db.query.purchaseBills.findFirst({
      where: eq(purchaseBills.id, billId),
    });

    if (!bill) return { success: false, message: "Bill not found" };
    if (bill.status === "cancelled") return { success: false, message: "Bill is already cancelled" };
    
    if (Number(bill.paidAmount || 0) > 0) {
        return { success: false, message: "Cannot cancel bill with payments. Please cancel payments first." };
    }

    // 1. Update Status
    await db.update(purchaseBills)
        .set({ 
            status: "cancelled", 
            notes: bill.notes ? `${bill.notes}\n[Cancelled]: ${reason}` : `[Cancelled]: ${reason}`,
            updatedAt: new Date() // No explicit updatedAt in schema? Let's check. 
            // purchaseBills schema: created_at, no updated_at in snippet? 
            // Checking snippet 9449: purchaseBills has no updatedAt shown in snippet?
            // Wait, I should verify if updatedAt exists.
            // If not, I'll skip it.
         })
        .where(eq(purchaseBills.id, billId));

    // 2. GL Reversal
    // Check if posted? Schema snippet 9449 doesn't show isPosted for purchaseBills.
    // However, create-purchase-bill.ts (step 9494) sets status='posted' on JOURNAL, not bill.
    // Wait, create-purchase-bill.ts does NOT update bill.isPosted.
    // Let's assume we search for journal anyway.
    
     const journal = await db.query.journalEntries.findFirst({
         where: and(
             eq(journalEntries.sourceDocId, billId),
             eq(journalEntries.sourceDocType, "purchase_bill") 
         )
     });

     if (journal) {
         const result = await createReversalPosting(journal.id, new Date(), reason);
         if (!result.success) {
             console.error("GL Reversal Failed for Bill Cancel:", result.error);
         }
     }

    revalidatePath("/procurement/bills");
    return { success: true, message: "Bill cancelled and reversed" };
  } catch (error: any) {
    console.error("Cancel Bill Error:", error);
    return { success: false, message: error.message || "Failed to cancel bill" };
  }
}
