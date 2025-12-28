"use server";

import { db } from "@/db";
import { 
  debitNotes, 
  debitNoteLines, 
  purchaseBills, 
  numberSeries,
  journalEntries,
  journalLines,
  chartOfAccounts,
  companies 
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ActionResponse = { success: boolean; message: string; data?: any };

export type DebitNoteLineInput = {
    itemId: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxAmount: number;
    lineTotal: number;
};

export type DebitNoteInput = {
    supplierId: string;
    billId?: string; // Optional link to bill
    debitNoteDate: string;
    reason: string;
    lines: DebitNoteLineInput[];
    notes?: string;
};

export async function createDebitNoteAction(input: DebitNoteInput): Promise<ActionResponse> {
    try {
        const DEMO_COMPANY_ID = "00000000-0000-0000-0000-000000000000";

        if (!input.supplierId || !input.lines.length) {
            return { success: false, message: "Supplier and lines are required" };
        }

        // 1. Generate Number
        const series = await db.query.numberSeries.findFirst({
            where: and(
                eq(numberSeries.companyId, DEMO_COMPANY_ID),
                eq(numberSeries.entityType, "debit_note"),
                eq(numberSeries.isActive, true)
            )
        });

        let dnNumber = `DN-${Date.now()}`;
        if (series) {
            const nextVal = (series.currentValue || 0) + 1;
            const yearPart = series.yearFormat === "YYYY" ? new Date().getFullYear().toString() : "";
            dnNumber = `${series.prefix}-${yearPart}-${nextVal.toString().padStart(5, '0')}`;
            await db.update(numberSeries).set({ currentValue: nextVal }).where(eq(numberSeries.id, series.id));
        }

        // 2. Calculations
        let subTotal = 0;
        let taxTotal = 0;
        input.lines.forEach(l => {
            subTotal += (l.quantity * l.unitPrice);
            taxTotal += l.taxAmount;
        });
        const totalAmount = subTotal + taxTotal;

        // 3. Transaction
        const result = await db.transaction(async (tx) => {
            // Header
            const [dn] = await tx.insert(debitNotes).values({
                companyId: DEMO_COMPANY_ID,
                debitNoteNumber: dnNumber,
                supplierId: input.supplierId,
                billId: input.billId, // Foreign key to purchase_bills
                debitNoteDate: new Date(input.debitNoteDate),
                reason: input.reason,
                subtotal: subTotal.toFixed(2),
                taxAmount: taxTotal.toFixed(2),
                totalAmount: totalAmount.toFixed(2),
                balanceAmount: totalAmount.toFixed(2), 
                status: "approved",
                notes: input.notes,
                isPosted: false
            }).returning();

            // Lines
            await tx.insert(debitNoteLines).values(
                input.lines.map((l, i) => ({
                    companyId: DEMO_COMPANY_ID,
                    debitNoteId: dn.id,
                    lineNumber: i + 1,
                    itemId: l.itemId,
                    description: l.description,
                    quantity: l.quantity.toString(),
                    unitPrice: l.unitPrice.toString(),
                    taxAmount: l.taxAmount.toFixed(2),
                    lineTotal: (l.quantity * l.unitPrice + l.taxAmount).toFixed(2)
                }))
            );

            // 4. GL Posting (Debit Note / Supplier Return)
            // DR: Accounts Payable (Liability decreases) - 2110
            // CR: Inventory / Expense (Asset/Exp decreases) - 1200 / 5100
            // CR: VAT Input (Asset decreases/reversal) - 2120 (Netting) or Input Vat Account

            const coa = await tx.query.chartOfAccounts.findMany({
                where: and(eq(chartOfAccounts.companyId, DEMO_COMPANY_ID))
            });
            const getAccountId = (code: string) => coa.find(a => a.code === code)?.id;

            const apAccountId = getAccountId("2110");
            const inventoryAccountId = getAccountId("1200"); // Or Expense
            // Defaulting check
            const taxAccountId = getAccountId("2120"); 

            if (apAccountId && inventoryAccountId && taxAccountId) {
                const journalSeries = await tx.query.numberSeries.findFirst({
                   where: and(eq(numberSeries.companyId, DEMO_COMPANY_ID), eq(numberSeries.entityType, "journal"))
                });
                let journalNum = `JV-${Date.now()}`;
                if (journalSeries) {
                   const nextJv = (journalSeries.currentValue || 0) + 1;
                   journalNum = `${journalSeries.prefix}-${journalSeries.yearFormat === 'YYYY' ? new Date().getFullYear() : ''}-${nextJv.toString().padStart(5, '0')}`;
                   await tx.update(numberSeries).set({ currentValue: nextJv }).where(eq(numberSeries.id, journalSeries.id));
                }

                const [journal] = await tx.insert(journalEntries).values({
                    companyId: DEMO_COMPANY_ID,
                    journalNumber: journalNum,
                    journalDate: new Date(input.debitNoteDate),
                    sourceDocType: "DEBIT_NOTE",
                    sourceDocId: dn.id,
                    sourceDocNumber: dnNumber,
                    description: `Debit Note ${dnNumber} for Bill ${input.billId || 'Unknown'}`,
                    totalDebit: totalAmount.toFixed(2),
                    totalCredit: totalAmount.toFixed(2),
                    status: "posted"
                }).returning();

                // 1. Debit AP (Liability decreases)
                await tx.insert(journalLines).values({
                    companyId: DEMO_COMPANY_ID,
                    journalId: journal.id,
                    lineNumber: 1,
                    accountId: apAccountId,
                    description: `Supplier Debit - ${dnNumber}`,
                    debit: totalAmount.toFixed(2),
                    credit: "0"
                });

                // 2. Credit Inventory/Expense
                await tx.insert(journalLines).values({
                    companyId: DEMO_COMPANY_ID,
                    journalId: journal.id,
                    lineNumber: 2,
                    accountId: inventoryAccountId,
                    description: `Purchase Return - ${dnNumber}`,
                    debit: "0",
                    credit: subTotal.toFixed(2)
                });

                // 3. Credit VAT Input (Reversal)
                if (taxTotal > 0) {
                    await tx.insert(journalLines).values({
                        companyId: DEMO_COMPANY_ID,
                        journalId: journal.id,
                        lineNumber: 3,
                        accountId: taxAccountId,
                        description: `VAT Reversal - ${dnNumber}`,
                        debit: "0",
                        credit: taxTotal.toFixed(2)
                    });
                }

                await tx.update(debitNotes).set({ isPosted: true }).where(eq(debitNotes.id, dn.id));
            }

            return { dn };
        });

        revalidatePath("/procurement/returns");
        return { success: true, message: `Debit Note ${dnNumber} created`, data: { id: result.dn.id } };

    } catch (error: any) {
        console.error("Create DN Error:", error);
        return { success: false, message: error.message };
    }
}
