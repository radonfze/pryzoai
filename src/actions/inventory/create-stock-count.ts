"use server";

import { db } from "@/db";
import { 
  items, 
  stockLedger,
  stockAdjustments,
  stockAdjustmentLines,
  numberSeries,
  chartOfAccounts
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCompanyId } from "@/lib/auth";
import { createStockMovement } from "@/lib/services/inventory-movement-service";
import { postStockAdjustmentToGL } from "@/lib/services/gl-posting-service";

export type ActionResponse = { success: boolean; message: string; data?: any };

export type StockCountItemInput = {
    itemId: string;
    countedQuantity: number;
    currentSystemStock: number; 
};

export type StockCountInput = {
    warehouseId: string;
    countDate: string;
    items: StockCountItemInput[];
    notes?: string;
};

export async function createStockCountAction(input: StockCountInput): Promise<ActionResponse> {
    try {
        const companyId = await getCompanyId();
        if (!companyId) return { success: false, message: "Unauthorized" };

        if (!input.warehouseId || !input.items.length) {
            return { success: false, message: "Warehouse and items required" };
        }

        const countDate = new Date(input.countDate);

        // 1. Generate Adjustment Number (Process it as a Stock Adjustment)
        const series = await db.query.numberSeries.findFirst({
            where: and(
                eq(numberSeries.companyId, companyId),
                eq(numberSeries.documentType, "stock_adjustment"),
                eq(numberSeries.isActive, true)
            )
        });
        
        let adjNumber = `ADJ-${Date.now()}`;
        if (series) {
             const nextVal = (series.currentValue || 0) + 1;
             adjNumber = `${series.prefix}-${nextVal.toString().padStart(5, '0')}`;
             await db.update(numberSeries).set({ currentValue: nextVal }).where(eq(numberSeries.id, series.id));
        }

        let totalVarianceValue = 0;

        await db.transaction(async (tx) => {
             // Create Header
             const [adj] = await tx.insert(stockAdjustments).values({
                 companyId,
                 adjustmentNumber: adjNumber,
                 adjustmentDate: input.countDate,
                 notes: input.notes || "Physical Stock Count Reconciliation",
                 status: "posted",
                 isPosted: true
             }).returning();

             // Process Lines
             let lineNum = 1;
             for (const countItem of input.items) {
                // Get Current Stock from Ledger (Source of Truth)
                const ledger = await tx.query.stockLedger.findFirst({
                    where: and(
                        eq(stockLedger.companyId, companyId),
                        eq(stockLedger.warehouseId, input.warehouseId),
                        eq(stockLedger.itemId, countItem.itemId)
                    )
                });

                const currentQty = Number(ledger?.quantityOnHand || 0);
                const difference = countItem.countedQuantity - currentQty;

                if (Math.abs(difference) < 0.0001) continue; // No change

                const varianceValue = difference * Number(ledger?.averageCost || 0); // Use Avg Cost for Value change
                totalVarianceValue += varianceValue;

                // Log Line
                await tx.insert(stockAdjustmentLines).values({
                    companyId,
                    adjustmentId: adj.id,
                    lineNumber: lineNum++,
                    itemId: countItem.itemId,
                    warehouseId: input.warehouseId,
                    currentQty: currentQty.toString(),
                    adjustedQty: countItem.countedQuantity.toString(),
                    variance: difference.toFixed(3),
                    reason: "Physical Count Variance"
                });

                // Move Stock (Update Ledger)
                await createStockMovement({
                    companyId,
                    warehouseId: input.warehouseId,
                    itemId: countItem.itemId,
                    transactionType: difference > 0 ? "adjustment_in" : "adjustment_out",
                    quantityChange: difference,
                    documentType: "stock_adjustment",
                    documentId: adj.id,
                    documentNumber: adjNumber,
                    reference: "Physical Stock Count",
                    transactionDate: countDate,
                    tx // Pass transaction
                }, tx);
             }

             // GL Posting
             if (Math.abs(totalVarianceValue) > 0.01) {
                 const coaList = await tx.query.chartOfAccounts.findMany({ where: eq(chartOfAccounts.companyId, companyId) });
                 const getAcc = (code: string) => coaList.find(c => c.code === code)?.id || "";

                 const glMapping = {
                     inventory: getAcc("1200"),
                     costOfGoodsSold: getAcc("5000"),
                     salesRevenue: "", salesVat: "", accountsReceivable: "", accountsPayable: "", purchaseVat: "", bank: "", cash: "", payrollExpense: "", payrollPayable: ""
                 };

                 if (glMapping.inventory && glMapping.costOfGoodsSold) {
                     await postStockAdjustmentToGL(
                         adj.id,
                         adjNumber,
                         countDate,
                         totalVarianceValue,
                         glMapping,
                         tx
                     );
                 }
             }
        });

        revalidatePath("/inventory/count");
        revalidatePath("/inventory/items");
        return { success: true, message: `Stock count reconciled. Adjustment ${adjNumber} created.` };

    } catch (error: any) {
        console.error("Stock Count Error:", error);
        return { success: false, message: error.message };
    }
}
