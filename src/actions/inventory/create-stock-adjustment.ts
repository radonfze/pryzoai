"use server";

import { db } from "@/db";
import { stockAdjustments, stockAdjustmentLines, numberSeries, items, chartOfAccounts } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { postStockAdjustmentToGL } from "@/lib/services/gl-posting-service";

export type ActionResponse = { success: boolean; message: string; data?: any };
type AdjustmentLine = { itemId: string; warehouseId: string; currentQty: number; adjustedQty: number; reason: string };
type StockAdjustmentInput = { adjustmentDate: string; lines: AdjustmentLine[]; notes?: string };

async function generateAdjustmentNumber(companyId: string, adjustmentDate: Date): Promise<string> {
  const series = await db.query.numberSeries.findFirst({
    where: and(eq(numberSeries.companyId, companyId), eq(numberSeries.documentType, "stock_adjustment"), eq(numberSeries.isActive, true)),
  });
  if (!series) return `ADJ-${Date.now()}`;
  const year = adjustmentDate.getFullYear();
  let yearPart = series.yearFormat === "YYYY" ? year.toString() : series.yearFormat === "YY" ? year.toString().slice(-2) : "";
  const nextNumber = series.currentValue;
  await db.update(numberSeries).set({ currentValue: nextNumber + 1, updatedAt: new Date() }).where(eq(numberSeries.id, series.id));
  const parts = [series.prefix]; if (yearPart) parts.push(yearPart); parts.push(nextNumber.toString().padStart(5, "0"));
  return parts.join(series.separator || "-");
}

import { getCompanyId } from "@/lib/auth";

export async function createStockAdjustmentAction(input: StockAdjustmentInput): Promise<ActionResponse> {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return { success: false, message: "Unauthorized: No active company" };
    const DEMO_COMPANY_ID = companyId;
    if (!input.adjustmentDate || !input.lines?.length) return { success: false, message: "Invalid input" };
    
    // Validate and Fetch Costs
    let totalVarianceValue = 0;

    // Pre-fetch items to get cost
    const itemIds = input.lines.map(l => l.itemId);
    
    // Fetch items
    const itemList = await db.query.items.findMany({
        where: inArray(items.id, itemIds)
    });
    
    const itemMap = new Map(itemList.map(i => [i.id, Number(i.costPrice || 0)]));

    for (const line of input.lines) {
        const cost = itemMap.get(line.itemId) || 0;
        const varianceQty = line.adjustedQty - line.currentQty;
        const varianceValue = varianceQty * cost;
        totalVarianceValue += varianceValue;
    }

    const adjustmentNumber = await generateAdjustmentNumber(DEMO_COMPANY_ID, new Date(input.adjustmentDate));
    
    // GL Account Fetch (Simulated for this action for now, or fetch standard accounts)
    // Ideally use a helper to get default accounts.
    // Simplifying for this "Fix": Hardcode Fetch of accounts for mapping
    const coaList = await db.query.chartOfAccounts.findMany({ where: eq(chartOfAccounts.companyId, DEMO_COMPANY_ID) });
    const getAcc = (code: string) => coaList.find(c => c.code === code)?.id || "";
    
    const glMapping = {
        inventory: getAcc("1200"), // Inventory Asset
        costOfGoodsSold: getAcc("5000"), // COGS / Adjustment Expense
        // Others not needed for this action
        salesRevenue: "", salesVat: "", accountsReceivable: "", accountsPayable: "", purchaseVat: "", bank: "", cash: "", payrollExpense: "", payrollPayable: ""
    };

    const result = await db.transaction(async (tx) => {
      // 1. Create Adjustment Header
      const [adj] = await tx.insert(stockAdjustments).values({ 
          companyId: DEMO_COMPANY_ID, 
          adjustmentNumber, 
          adjustmentDate: input.adjustmentDate, 
          notes: input.notes, 
          status: "posted", // Directly posted for now
          isPosted: true 
      }).returning();
      
      // 2. Create Adjustment Lines
      await tx.insert(stockAdjustmentLines).values(input.lines.map((l, i) => ({ 
          companyId: DEMO_COMPANY_ID, 
          adjustmentId: adj.id, 
          lineNumber: i + 1, 
          itemId: l.itemId, 
          warehouseId: l.warehouseId, 
          currentQty: l.currentQty.toString(), 
          adjustedQty: l.adjustedQty.toString(), 
          variance: (l.adjustedQty - l.currentQty).toFixed(2), 
          reason: l.reason 
      })));
      
      // 3. GL Posting
      // Only post if variance value is non-zero and we have accounts mapped
      if (glMapping.inventory && glMapping.costOfGoodsSold && Math.abs(totalVarianceValue) > 0.01) {
          await postStockAdjustmentToGL(
              adj.id, 
              adjustmentNumber, 
              new Date(input.adjustmentDate), 
              totalVarianceValue, 
              glMapping
          );
      }

      return { adj };
    });
    
    revalidatePath("/inventory/adjustments");
    return { success: true, message: `Stock Adjustment ${adjustmentNumber} created`, data: { id: result.adj.id, adjustmentNumber } };
  } catch (error: any) {
    console.error("Stock Adjustment Error:", error);
    return { success: false, message: error.message || "Failed to create adjustment" };
  }
}
