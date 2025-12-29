"use server";

import { db } from "@/db";
import { 
  purchaseReturns, 
  purchaseReturnLines, 
  purchaseBills, 
  items, 
  numberSeries,
  inventoryTransactions,
  journalEntries,
  journalLines,
  chartOfAccounts
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ActionResponse = { success: boolean; message: string; data?: any };

export type PurchaseReturnLineInput = {
    itemId: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxAmount: number;
};

export type PurchaseReturnInput = {
    supplierId: string;
    billId?: string; // Link to original bill
    returnDate: string;
    warehouseId: string;
    lines: PurchaseReturnLineInput[];
    reason?: string;
    notes?: string;
};

import { getCompanyId } from "@/lib/auth";

export async function createPurchaseReturnAction(input: PurchaseReturnInput): Promise<ActionResponse> {
    try {
        const companyId = await getCompanyId();
        if (!companyId) return { success: false, message: "Unauthorized: No active company" };
        const DEMO_COMPANY_ID = companyId;

        if (!input.supplierId || !input.lines.length || !input.warehouseId) {
            return { success: false, message: "Valid input required" };
        }

        // 1. Generate Number
        const series = await db.query.numberSeries.findFirst({
            where: and(
                eq(numberSeries.companyId, DEMO_COMPANY_ID),
                eq(numberSeries.entityType, "purchase_return"),
                eq(numberSeries.isActive, true)
            )
        });

        let prNumber = `PR-${Date.now()}`;
        if (series) {
            const nextVal = (series.currentValue || 0) + 1;
            const yearPart = series.yearFormat === "YYYY" ? new Date().getFullYear().toString() : "";
            prNumber = `${series.prefix}-${yearPart}-${nextVal.toString().padStart(5, '0')}`;
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
            const [pr] = await tx.insert(purchaseReturns).values({
                companyId: DEMO_COMPANY_ID,
                returnNumber: prNumber,
                supplierId: input.supplierId,
                billId: input.billId,
                returnDate: new Date(input.returnDate),
                warehouseId: input.warehouseId,
                reason: input.reason,
                subtotal: subTotal.toFixed(2),
                taxAmount: taxTotal.toFixed(2),
                totalAmount: totalAmount.toFixed(2),
                status: "approved",
                notes: input.notes,
                isPosted: false
            }).returning();

            // Lines
            await tx.insert(purchaseReturnLines).values(
                input.lines.map((l, i) => ({
                    companyId: DEMO_COMPANY_ID,
                    returnId: pr.id,
                    lineNumber: i + 1,
                    itemId: l.itemId,
                    description: l.description, // Schema check: usually description or just itemId
                    quantity: l.quantity.toString(),
                    unitPrice: l.unitPrice.toString(),
                    taxAmount: l.taxAmount.toFixed(2),
                    lineTotal: (l.quantity * l.unitPrice + l.taxAmount).toFixed(2)
                }))
            );

            // 4. Inventory Impact (Deduct Stock - Return OUT)
            for (const line of input.lines) {
                const item = await tx.query.items.findFirst({ where: eq(items.id, line.itemId) });
                if (item) {
                     const newStock = Number(item.stockQuantity || 0) - Number(line.quantity);
                     await tx.update(items)
                        .set({ stockQuantity: newStock.toString() })
                        .where(eq(items.id, line.itemId));

                     await tx.insert(inventoryTransactions).values({
                        companyId: DEMO_COMPANY_ID,
                        transactionDate: new Date(input.returnDate),
                        itemId: line.itemId,
                        warehouseId: input.warehouseId,
                        transactionType: "OUT",
                        documentType: "PR",
                        documentId: pr.id,
                        documentNumber: prNumber,
                        quantity: line.quantity.toString(),
                        unitCost: item.costPrice || "0",
                        totalValue: (Number(line.quantity) * Number(item.costPrice || 0)).toString(),
                        reference: `Purchase Return to ${input.supplierId}`
                     });
                }
            }

            // 5. GL Posting (Financial Impact)
            // Same as Debit Note basically: Debit AP, Credit Inventory
            // Ideally should reuse Debit Note or link them.
            // If Purchase Return is "goods movement", Debit Note is "financial document".
            // Implementation: PR updates stock. Financials handled here too or via derived DN.
            // Let's do simple GL posting here for "Purchase Return" document type.
            
            const coa = await tx.query.chartOfAccounts.findMany({
                where: and(eq(chartOfAccounts.companyId, DEMO_COMPANY_ID))
            });
            const getAccountId = (code: string) => coa.find(a => a.code === code)?.id;

            const apAccountId = getAccountId("2110"); // Accounts Payable
            const inventoryAccountId = getAccountId("1200"); // Inventory Asset (Credit this as stock leaves)
            const taxAccountId = getAccountId("2120"); // VAT Input (Reversal)

            if (apAccountId && inventoryAccountId) {
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
                    journalDate: new Date(input.returnDate),
                    sourceDocType: "PURCHASE_RETURN",
                    sourceDocId: pr.id,
                    sourceDocNumber: prNumber,
                    description: `Purchase Return ${prNumber}`,
                    totalDebit: totalAmount.toFixed(2),
                    totalCredit: totalAmount.toFixed(2),
                    status: "posted"
                }).returning();

                // 1. Debit AP (Liability Reduc.)
                await tx.insert(journalLines).values({
                    companyId: DEMO_COMPANY_ID,
                    journalId: journal.id,
                    lineNumber: 1,
                    accountId: apAccountId,
                    description: `Return Credit - ${prNumber}`,
                    debit: totalAmount.toFixed(2),
                    credit: "0"
                });

                // 2. Credit Inventory (Asset Reduc.)
                await tx.insert(journalLines).values({
                    companyId: DEMO_COMPANY_ID,
                    journalId: journal.id,
                    lineNumber: 2,
                    accountId: inventoryAccountId,
                    description: `Inventory Return - ${prNumber}`,
                    debit: "0",
                    credit: subTotal.toFixed(2)
                });

                // 3. Credit VAT
                 if (taxTotal > 0 && taxAccountId) {
                    await tx.insert(journalLines).values({
                        companyId: DEMO_COMPANY_ID,
                        journalId: journal.id,
                        lineNumber: 3,
                        accountId: taxAccountId,
                        description: `VAT Reversal - ${prNumber}`,
                        debit: "0",
                        credit: taxTotal.toFixed(2)
                    });
                }
                
                await tx.update(purchaseReturns).set({ isPosted: true }).where(eq(purchaseReturns.id, pr.id));
            }

            return { pr };
        });

        revalidatePath("/procurement/returns");
        revalidatePath("/inventory/ledger");

        return { success: true, message: `Purchase Return ${prNumber} created`, data: { id: result.pr.id } };

    } catch (error: any) {
        console.error("Create PR Error:", error);
        return { success: false, message: error.message };
    }
}
