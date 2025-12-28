"use server";

import { db } from "@/db";
import { 
  inventoryTransactions, 
  items, 
  numberSeries, 
  journalEntries, 
  journalLines, 
  chartOfAccounts,
  warehouses
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ActionResponse = { success: boolean; message: string; data?: any };

// Simple Stock Count: "I counted X for Item Y in Warehouse Z"
// This action will create an adjustment transaction if difference exists.
export type StockCountItemInput = {
    itemId: string;
    countedQuantity: number;
    currentSystemStock: number; // passed from UI for verification or fetched fresh
};

export type StockCountInput = {
    warehouseId: string;
    countDate: string;
    items: StockCountItemInput[];
    notes?: string;
};

export async function createStockCountAction(input: StockCountInput): Promise<ActionResponse> {
    try {
        const DEMO_COMPANY_ID = "00000000-0000-0000-0000-000000000000";

        if (!input.warehouseId || !input.items.length) {
            return { success: false, message: "Warehouse and items required" };
        }

        // 1. Generate Count Reference / Number (Optional, or just Adjustment number)
        // Let's generate an Adjustment identifier for the whole batch
        const series = await db.query.numberSeries.findFirst({
            where: and(
                eq(numberSeries.companyId, DEMO_COMPANY_ID),
                eq(numberSeries.entityType, "stock_adjustment"),
                eq(numberSeries.isActive, true)
            )
        });
        
        // We might just use one adjustment number for the whole batch or per item. 
        // Let's generate one reference.
        let adjNumber = `ADJ-${Date.now()}`;
        if (series) {
             const nextVal = (series.currentValue || 0) + 1;
             adjNumber = `${series.prefix}-${nextVal.toString().padStart(5, '0')}`;
             await db.update(numberSeries).set({ currentValue: nextVal }).where(eq(numberSeries.id, series.id));
        }

        let totalAdjustmentValue = 0;
        const adjustmentEntries: any[] = [];

        await db.transaction(async (tx) => {
             for (const countItem of input.items) {
                // Fetch fresh stock to be safe (concurrency)
                // Note: Real system needs locking or "as of" logic.
                const item = await tx.query.items.findFirst({ where: eq(items.id, countItem.itemId) });
                if (!item) continue;
                
                const systemQty = Number(item.stockQuantity || 0);
                const difference = countItem.countedQuantity - systemQty;

                if (difference === 0) continue; // No adjustment needed

                // Update Stock
                await tx.update(items)
                    .set({ stockQuantity: countItem.countedQuantity.toString() })
                    .where(eq(items.id, item.id));

                const cost = Number(item.costPrice || 0);
                const valueChange = difference * cost;
                totalAdjustmentValue += valueChange;
                
                // Inventory Transaction
                await tx.insert(inventoryTransactions).values({
                    companyId: DEMO_COMPANY_ID,
                    transactionDate: new Date(input.countDate),
                    itemId: countItem.itemId,
                    warehouseId: input.warehouseId,
                    transactionType: difference > 0 ? "IN" : "OUT",
                    documentType: "ADJ",
                    documentNumber: adjNumber, // Using same number for batch or unique? Let's use batch ref.
                    quantity: Math.abs(difference).toString(),
                    unitCost: cost.toString(),
                    totalValue: Math.abs(valueChange).toString(),
                    reference: `Stock Count Adjustment`,
                    notes: input.notes
                });
             }

             // GL Posting (Stock Adjustment)
             // If Net Positive (Gain): Dr Inventory, Cr Cost of Goods Sold / Inventory Gain (Expense/Income)
             // If Net Negative (Loss): Dr Shrinkage/COGS, Cr Inventory
             
             if (totalAdjustmentValue !== 0) {
                 const coa = await tx.query.chartOfAccounts.findMany({
                    where: and(eq(chartOfAccounts.companyId, DEMO_COMPANY_ID))
                });
                const getAccountId = (code: string) => coa.find(a => a.code === code)?.id;

                const inventoryId = getAccountId("1200");
                const adjustmentId = getAccountId("5100"); // COGS or Specific Adjustment Account

                if (inventoryId && adjustmentId) {
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
                        journalDate: new Date(input.countDate),
                        sourceDocType: "STOCK_ADJUSTMENT",
                        sourceDocId: "BATCH", // No single ID, maybe create a Batch Header table in future
                        sourceDocNumber: adjNumber,
                        description: `Stock Count Adjustment ${adjNumber}`,
                        totalDebit: Math.abs(totalAdjustmentValue).toFixed(2),
                        totalCredit: Math.abs(totalAdjustmentValue).toFixed(2),
                        status: "posted"
                    }).returning();

                    if (totalAdjustmentValue > 0) {
                        // Gain
                        // Dr Inventory
                         await tx.insert(journalLines).values({
                            companyId: DEMO_COMPANY_ID,
                            journalId: journal.id,
                            lineNumber: 1,
                            accountId: inventoryId,
                            description: "Inventory Gain",
                            debit: totalAdjustmentValue.toFixed(2),
                            credit: "0"
                        });
                        // Cr Expense (Reduction) or Income
                         await tx.insert(journalLines).values({
                            companyId: DEMO_COMPANY_ID,
                            journalId: journal.id,
                            lineNumber: 2,
                            accountId: adjustmentId,
                            description: "Stock Adjustment Gain",
                            debit: "0",
                            credit: totalAdjustmentValue.toFixed(2)
                        });
                    } else {
                        // Loss
                        // Dr Expense
                        await tx.insert(journalLines).values({
                            companyId: DEMO_COMPANY_ID,
                            journalId: journal.id,
                            lineNumber: 1,
                            accountId: adjustmentId,
                            description: "Stock Adjustment Loss",
                            debit: Math.abs(totalAdjustmentValue).toFixed(2),
                            credit: "0"
                        });
                        // Cr Inventory
                        await tx.insert(journalLines).values({
                            companyId: DEMO_COMPANY_ID,
                            journalId: journal.id,
                            lineNumber: 2,
                            accountId: inventoryId,
                            description: "Inventory Shrinkage",
                            debit: "0",
                            credit: Math.abs(totalAdjustmentValue).toFixed(2)
                        });
                    }
                }
             }
        });

        revalidatePath("/inventory/count");
        revalidatePath("/inventory/items");
        return { success: true, message: "Stock count reconciled successfully" };

    } catch (error: any) {
        console.error("Stock Count Error:", error);
        return { success: false, message: error.message };
    }
}
