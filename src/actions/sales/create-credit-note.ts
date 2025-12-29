"use server";

import { db } from "@/db";
import { 
  creditNotes, 
  creditNoteLines, 
  salesInvoices, 
  salesLines,
  items, 
  numberSeries,
  companies,
  journalEntries,
  journalLines,
  chartOfAccounts,
  customerPayments
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ActionResponse = {
  success: boolean;
  message: string;
  data?: any;
};

export type CreditNoteLineInput = {
    itemId: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxAmount: number;
    lineTotal: number;
};

export type CreditNoteInput = {
    customerId: string;
    invoiceId?: string; // Optional link to invoice
    creditNoteDate: string;
    reason: string;
    lines: CreditNoteLineInput[];
    notes?: string;
};

import { getCompanyId } from "@/lib/auth";

export async function createCreditNoteAction(input: CreditNoteInput): Promise<ActionResponse> {
    try {
        const companyId = await getCompanyId();
        if (!companyId) return { success: false, message: "Unauthorized: No active company" };
        const DEMO_COMPANY_ID = companyId;

        if (!input.customerId || !input.lines.length) {
            return { success: false, message: "Customer and lines are required" };
        }

        // 1. Generate Number
        const series = await db.query.numberSeries.findFirst({
            where: and(
                eq(numberSeries.companyId, DEMO_COMPANY_ID),
                eq(numberSeries.entityType, "credit_note"),
                eq(numberSeries.isActive, true)
            )
        });

        let cnNumber = `CN-${Date.now()}`;
        if (series) {
            const nextVal = (series.currentValue || 0) + 1;
            const yearPart = series.yearFormat === "YYYY" ? new Date().getFullYear().toString() : "";
            cnNumber = `${series.prefix}-${yearPart}-${nextVal.toString().padStart(5, '0')}`;
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
            const [cn] = await tx.insert(creditNotes).values({
                companyId: DEMO_COMPANY_ID,
                creditNoteNumber: cnNumber,
                customerId: input.customerId,
                invoiceId: input.invoiceId,
                creditNoteDate: new Date(input.creditNoteDate),
                reason: input.reason,
                subtotal: subTotal.toFixed(2),
                taxAmount: taxTotal.toFixed(2),
                totalAmount: totalAmount.toFixed(2),
                balanceAmount: totalAmount.toFixed(2), // Initially unused
                status: "issued", // auto-approve for now
                notes: input.notes,
                isPosted: false
            }).returning();

            // Lines
            await tx.insert(creditNoteLines).values(
                input.lines.map((l, i) => ({
                    companyId: DEMO_COMPANY_ID,
                    creditNoteId: cn.id,
                    lineNumber: i + 1,
                    itemId: l.itemId,
                    description: l.description,
                    quantity: l.quantity.toString(),
                    unitPrice: l.unitPrice.toString(),
                    taxAmount: l.taxAmount.toFixed(2),
                    lineTotal: (l.quantity * l.unitPrice + l.taxAmount).toFixed(2)
                }))
            );

            // 4. GL Posting
            // DR: Sales Returns (Contra Revenue) or Sales Revenue directly (4100) - Let's use Returns if exists, else Sales
            // DR: VAT Output (Liability decreases) - 2120
            // CR: Accounts Receivable (Asset decreases) - 1130

            const coa = await tx.query.chartOfAccounts.findMany({
                where: and(eq(chartOfAccounts.companyId, DEMO_COMPANY_ID))
            });
            const getAccountId = (code: string) => coa.find(a => a.code === code)?.id;

            const arAccountId = getAccountId("1130");
            const taxAccountId = getAccountId("2120");
            // Ideally Sales Returns (4xxx), defaulting to Sales (which we debit to reverse)
            const salesAccountId = getAccountId("4100"); 

            if (arAccountId && taxAccountId && salesAccountId) {
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
                    journalDate: new Date(input.creditNoteDate),
                    sourceDocType: "CREDIT_NOTE",
                    sourceDocId: cn.id,
                    sourceDocNumber: cnNumber,
                    description: `Credit Note ${cnNumber} for Invoice ${input.invoiceId || 'Unknown'}`,
                    totalDebit: totalAmount.toFixed(2),
                    totalCredit: totalAmount.toFixed(2),
                    status: "posted"
                }).returning();

                // 1. Debit Sales (Revenue decreases)
                await tx.insert(journalLines).values({
                    companyId: DEMO_COMPANY_ID,
                    journalId: journal.id,
                    lineNumber: 1,
                    accountId: salesAccountId,
                    description: `Sales Return - ${cnNumber}`,
                    debit: subTotal.toFixed(2),
                    credit: "0"
                });

                // 2. Debit Tax (Liability decreases)
                if (taxTotal > 0) {
                    await tx.insert(journalLines).values({
                        companyId: DEMO_COMPANY_ID,
                        journalId: journal.id,
                        lineNumber: 2,
                        accountId: taxAccountId,
                        description: `VAT Adjustment - ${cnNumber}`,
                        debit: taxTotal.toFixed(2),
                        credit: "0"
                    });
                }

                // 3. Credit AR (Asset decreases)
                await tx.insert(journalLines).values({
                    companyId: DEMO_COMPANY_ID,
                    journalId: journal.id,
                    lineNumber: 3,
                    accountId: arAccountId,
                    description: `Customer Credit - ${cnNumber}`,
                    debit: "0",
                    credit: totalAmount.toFixed(2)
                });

                await tx.update(creditNotes).set({ isPosted: true }).where(eq(creditNotes.id, cn.id));
            }

            return { cn };
        });

        revalidatePath("/sales/returns"); // Assuming this is where CNs are listed or separate page
        return { success: true, message: `Credit Note ${cnNumber} created`, data: { id: result.cn.id } };

    } catch (error: any) {
        console.error("Create CN Error:", error);
        return { success: false, message: error.message };
    }
}
