"use server";

import { db } from "@/db";
import { salesReturns, salesReturnLines, salesInvoices, numberSeries } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ActionResponse = { success: boolean; message: string; data?: any };

type ReturnLine = { itemId: string; quantity: number; unitPrice: number; reason?: string };
type SalesReturnInput = { invoiceId: string; returnDate: string; lines: ReturnLine[]; notes?: string };

async function generateReturnNumber(companyId: string, returnDate: Date): Promise<string> {
  const series = await db.query.numberSeries.findFirst({
    where: and(eq(numberSeries.companyId, companyId), eq(numberSeries.documentType, "sales_return"), eq(numberSeries.isActive, true)),
  });
  if (!series) return `SR-${Date.now()}`;
  const year = returnDate.getFullYear();
  let yearPart = series.yearFormat === "YYYY" ? year.toString() : series.yearFormat === "YY" ? year.toString().slice(-2) : "";
  const nextNumber = series.currentValue;
  await db.update(numberSeries).set({ currentValue: nextNumber + 1, updatedAt: new Date() }).where(eq(numberSeries.id, series.id));
  const parts = [series.prefix]; if (yearPart) parts.push(yearPart); parts.push(nextNumber.toString().padStart(5, "0"));
  return parts.join(series.separator || "-");
}

export async function createSalesReturnAction(input: SalesReturnInput): Promise<ActionResponse> {
  try {
    const DEMO_COMPANY_ID = "00000000-0000-0000-0000-000000000000";
    if (!input.invoiceId || !input.returnDate || !input.lines?.length) return { success: false, message: "Invalid input" };
    const returnNumber = await generateReturnNumber(DEMO_COMPANY_ID, new Date(input.returnDate));
    const totalAmount = input.lines.reduce((sum, l) => sum + Number(l.quantity) * Number(l.unitPrice), 0);
    const result = await db.transaction(async (tx) => {
      const [ret] = await tx.insert(salesReturns).values({ companyId: DEMO_COMPANY_ID, invoiceId: input.invoiceId, returnNumber, returnDate: input.returnDate, totalAmount: totalAmount.toFixed(2), notes: input.notes, status: "draft" }).returning();
      await tx.insert(salesReturnLines).values(input.lines.map((l, i) => ({ companyId: DEMO_COMPANY_ID, returnId: ret.id, lineNumber: i + 1, itemId: l.itemId, quantity: l.quantity.toString(), unitPrice: l.unitPrice.toString(), lineTotal: (Number(l.quantity) * Number(l.unitPrice)).toFixed(2), reason: l.reason })));
      return { ret };
    });
    revalidatePath("/sales/returns");
    return { success: true, message: `Sales Return ${returnNumber} created`, data: { id: result.ret.id, returnNumber } };
  } catch (error: any) {
    return { success: false, message: error.message || "Failed" };
  }
}
