"use server";

import { db } from "@/db";
import { purchaseInvoices, purchaseLines, purchaseOrders, numberSeries, defaultGlAccounts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { postPurchaseBillToGL } from "@/lib/services/gl-posting-service";

export type ActionResponse = { success: boolean; message: string; data?: any };
type BillLine = { poLineId?: string; itemId: string; quantity: number; unitPrice: number; taxAmount?: number };
type PurchaseBillInput = { purchaseOrderId?: string; supplierId: string; billDate: string; dueDate: string; reference?: string; lines: BillLine[]; notes?: string };

const DEMO_COMPANY_ID = "00000000-0000-0000-0000-000000000000";

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
    if (!input.supplierId || !input.billDate || !input.lines?.length) {
      return { success: false, message: "Invalid input" };
    }
    
    const billNumber = await generateBillNumber(DEMO_COMPANY_ID, new Date(input.billDate));
    const subtotal = input.lines.reduce((sum, l) => sum + Number(l.quantity) * Number(l.unitPrice), 0);
    const taxTotal = input.lines.reduce((sum, l) => sum + Number(l.taxAmount || 0), 0);
    const total = subtotal + taxTotal;

    const result = await db.transaction(async (tx) => {
      // 1. Insert Bill Header (Purchase Invoice)
      const [bill] = await tx.insert(purchaseInvoices).values({
        companyId: DEMO_COMPANY_ID,
        invoiceNumber: billNumber,
        purchaseOrderId: input.purchaseOrderId || null,
        supplierId: input.supplierId,
        invoiceDate: input.billDate,
        dueDate: input.dueDate,
        supplierInvoiceNo: input.reference,
        subtotal: subtotal.toFixed(2),
        taxAmount: taxTotal.toFixed(2),
        totalAmount: total.toFixed(2),
        paidAmount: "0",
        balanceAmount: total.toFixed(2),
        notes: input.notes,
        status: "draft",
      }).returning();

      // 2. Insert Bill Lines
      await tx.insert(purchaseLines).values(
        input.lines.map((line, index) => ({
          companyId: DEMO_COMPANY_ID,
          invoiceId: bill.id,
          lineNumber: index + 1,
          purchaseOrderLineId: line.poLineId || null,
          itemId: line.itemId,
          quantity: line.quantity.toString(),
          uom: 'PCS', // Default UOM as it is required in schema
          unitPrice: line.unitPrice.toString(),
          taxAmount: (line.taxAmount || 0).toString(),
          lineTotal: (Number(line.quantity) * Number(line.unitPrice) + Number(line.taxAmount || 0)).toString(),
        }))
      );

      // 3. GL Posting: Use Standard Service
      // Fetch GL Mapping
      const defaults = await tx.query.defaultGlAccounts.findMany({
          where: eq(defaultGlAccounts.companyId, DEMO_COMPANY_ID)
      });
      const getDef = (key: string) => defaults.find(d => d.mappingKey === key)?.accountId;

      const glMapping = {
        salesRevenue: getDef("DEFAULT_SALES") || "",
        salesVat: getDef("VAT_PAYABLE") || "",
        accountsReceivable: getDef("DEFAULT_RECEIVABLE") || "",
        inventory: getDef("DEFAULT_INVENTORY") || "",
        costOfGoodsSold: getDef("DEFAULT_COGS") || "",
        accountsPayable: getDef("DEFAULT_PAYABLE") || "",
        purchaseVat: getDef("VAT_RECEIVABLE") || "",
        bank: getDef("DEFAULT_BANK") || "",
        cash: getDef("DEFAULT_CASH") || "",
        payrollExpense: getDef("PAYROLL_EXPENSE") || "",
        payrollPayable: getDef("PAYROLL_PAYABLE") || ""
      };

      await postPurchaseBillToGL(
        bill.id,
        billNumber,
        new Date(input.billDate),
        input.supplierId,
        Number(subtotal),
        Number(taxTotal),
        Number(total),
        glMapping
      );

      return { bill };
    });

    revalidatePath("/procurement/bills");
    return { success: true, message: `Purchase Bill ${billNumber} created`, data: { id: result.bill.id, billNumber } };
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to create purchase bill" };
  }
}
