"use server";

import { db } from "@/db";
import { purchaseBills, purchaseBillLines, purchaseOrders, numberSeries } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ActionResponse = { success: boolean; message: string; data?: any };
type BillLine = { poLineId?: string; itemId: string; quantity: number; unitPrice: number; taxAmount?: number };
type PurchaseBillInput = { purchaseOrderId?: string; supplierId: string; billDate: string; dueDate: string; reference?: string; lines: BillLine[]; notes?: string };

async function generateBillNumber(companyId: string, billDate: Date): Promise<string> {
  const series = await db.query.numberSeries.findFirst({
    where: and(eq(numberSeries.companyId, companyId), eq(numberSeries.documentType, "purchase_bill"), eq(numberSeries.isActive, true)),
  });
  if (!series) return `BILL-${Date.now()}`;
  const year = billDate.getFullYear();
  let yearPart = series.yearFormat === "YYYY" ? year.toString() : series.yearFormat === "YY" ? year.toString().slice(-2) : "";
  const nextNumber = series.currentValue;
  await db.update(numberSeries).set({ currentValue: nextNumber + 1, updatedAt: new Date() }).where(eq(numberSeries.id, series.id));
  const parts = [series.prefix]; if (yearPart) parts.push(yearPart); parts.push(nextNumber.toString().padStart(5, "0"));
  return parts.join(series.separator || "-");
}

export async function createPurchaseBillAction(input: PurchaseBillInput): Promise<ActionResponse> {
  try {
    const DEMO_COMPANY_ID = "00000000-0000-0000-0000-000000000000";
    if (!input.supplierId || !input.billDate || !input.lines?.length) return { success: false, message: "Invalid input" };
    const billNumber = await generateBillNumber(DEMO_COMPANY_ID, new Date(input.billDate));
    const subtotal = input.lines.reduce((sum, l) => sum + Number(l.quantity) * Number(l.unitPrice), 0);
    const taxTotal = input.lines.reduce((sum, l) => sum + Number(l.taxAmount || 0), 0);
    const total = subtotal + taxTotal;
    const result = await db.transaction(async (tx) => {
      const [bill] = await tx.insert(purchaseBills).values({ companyId: DEMO_COMPANY_ID, supplierId: input.supplierId, purchaseOrderId: input.purchaseOrderId, billNumber, billDate: input.billDate, dueDate: input.dueDate, reference: input.reference, subtotal: subtotal.toFixed(2), taxAmount: taxTotal.toFixed(2), totalAmount: total.toFixed(2), notes: input.notes, status: "draft" }).returning();
      await tx.insert(purchaseBillLines).values(input.lines.map((l, i) => ({ companyId: DEMO_COMPANY_ID, billId: bill.id, lineNumber: i + 1, purchaseOrderLineId: l.poLineId, itemId: l.itemId, quantity: l.quantity.toString(), unitPrice: l.unitPrice.toString(), taxAmount: (l.taxAmount || 0).toFixed(2), lineTotal: (Number(l.quantity) * Number(l.unitPrice) + Number(l.taxAmount || 0)).toFixed(2) })));
      return { bill };
    });
    revalidatePath("/procurement/bills");
    return { success: true, message: `Purchase Bill ${billNumber} created`, data: { id: result.bill.id, billNumber } };
  } catch (error: any) {
    return { success: false, message: error.message || "Failed" };
  }
}
