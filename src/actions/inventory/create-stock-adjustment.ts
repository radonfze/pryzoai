"use server";

import { db } from "@/db";
import { stockAdjustments, stockAdjustmentLines, numberSeries } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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

export async function createStockAdjustmentAction(input: StockAdjustmentInput): Promise<ActionResponse> {
  try {
    const DEMO_COMPANY_ID = "00000000-0000-0000-0000-000000000000";
    if (!input.adjustmentDate || !input.lines?.length) return { success: false, message: "Invalid input" };
    const adjustmentNumber = await generateAdjustmentNumber(DEMO_COMPANY_ID, new Date(input.adjustmentDate));
    const result = await db.transaction(async (tx) => {
      const [adj] = await tx.insert(stockAdjustments).values({ companyId: DEMO_COMPANY_ID, adjustmentNumber, adjustmentDate: input.adjustmentDate, notes: input.notes, status: "draft", isPosted: false }).returning();
      await tx.insert(stockAdjustmentLines).values(input.lines.map((l, i) => ({ companyId: DEMO_COMPANY_ID, adjustmentId: adj.id, lineNumber: i + 1, itemId: l.itemId, warehouseId: l.warehouseId, currentQty: l.currentQty.toString(), adjustedQty: l.adjustedQty.toString(), variance: (l.adjustedQty - l.currentQty).toFixed(2), reason: l.reason })));
      return { adj };
    });
    revalidatePath("/inventory/adjustments");
    return { success: true, message: `Stock Adjustment ${adjustmentNumber} created`, data: { id: result.adj.id, adjustmentNumber } };
  } catch (error: any) {
    return { success: false, message: error.message || "Failed" };
  }
}
