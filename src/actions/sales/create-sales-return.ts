"use server";

import { db } from "@/db";
import { salesReturns, salesLines, salesInvoices, numberSeries } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCompanyId } from "@/lib/auth";

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
  const nextNumber = series.currentValue || 1000;
  
  await db.update(numberSeries).set({ currentValue: nextNumber + 1, updatedAt: new Date() }).where(eq(numberSeries.id, series.id));
  
  const parts = [series.prefix]; if (yearPart) parts.push(yearPart); parts.push(nextNumber.toString().padStart(5, "0"));
  return parts.join(series.separator || "-");
}

export async function createSalesReturnAction(input: SalesReturnInput): Promise<ActionResponse> {
  try {
    const companyId = await getCompanyId();
    
    // 1. Strict Validation: Original Invoice Required
    if (!input.invoiceId) {
        return { success: false, message: "Original Invoice Link is MANDATORY for Sales Returns." };
    }
    
    if (!input.returnDate || !input.lines?.length) {
        return { success: false, message: "Invalid input: Date and Items required." };
    }

    // 2. Fetch Original Invoice to validate Customer and Items
    const originalInvoice = await db.query.salesInvoices.findFirst({
        where: eq(salesInvoices.id, input.invoiceId),
        with: { lines: true }
    });

    if (!originalInvoice) {
        return { success: false, message: "Original Invoice not found." };
    }

    // 3. Verify Returned Items exist in Invoice
    // (Simplification: Just check ID presence, in real app check remaining quantity > return quantity)
    for (const line of input.lines) {
        const originalLine = originalInvoice.lines.find(l => l.itemId === line.itemId);
        if (!originalLine) {
            return { success: false, message: `Item ${line.itemId} does not exist in original invoice.` };
        }
        if (Number(line.quantity) > Number(originalLine.quantity)) { // Simple check against original qty
             return { success: false, message: `Return Qty (${line.quantity}) exceeds Invoiced Qty (${originalLine.quantity}) for item.` };
        }
    }

    const returnNumber = await generateReturnNumber(companyId, new Date(input.returnDate));
    const totalAmount = input.lines.reduce((sum, l) => sum + Number(l.quantity) * Number(l.unitPrice), 0);
    
    // 4. Create Return Logic
    const result = await db.transaction(async (tx) => {
      const [ret] = await tx.insert(salesReturns).values({ 
          companyId, 
          invoiceId: input.invoiceId, 
          originalInvoiceId: input.invoiceId, // Mandatory Field
          customerId: originalInvoice.customerId, // Auto-link to same customer
          returnNumber, 
          returnDate: new Date(input.returnDate), 
          totalAmount: totalAmount.toFixed(2), 
          reason: input.lines[0].reason || "General Return",
          notes: input.notes, 
          status: "draft" 
      }).returning();
      
      await tx.insert(salesLines).values(input.lines.map((l, i) => ({ 
          companyId, 
          returnId: ret.id, 
          lineNumber: i + 1, 
          itemId: l.itemId, 
          quantity: l.quantity.toString(), 
          uom: "PCS", // Should fetch from item
          unitPrice: l.unitPrice.toString(), 
          lineTotal: (Number(l.quantity) * Number(l.unitPrice)).toFixed(2), 
          description: l.reason 
      })));
      
      return { ret };
    });
    
    revalidatePath("/sales/returns");
    return { success: true, message: `Sales Return ${returnNumber} created`, data: { id: result.ret.id, returnNumber } };
  } catch (error: any) {
    console.error("Return Creation Error:", error);
    return { success: false, message: error.message || "Failed to create return" };
  }
}
