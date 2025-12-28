"use server";

import { db } from "@/db";
import { purchaseBills, purchaseBillLines, purchaseOrders, numberSeries, journalEntries, journalLines, chartOfAccounts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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
      // 1. Insert Bill Header
      const [bill] = await tx.insert(purchaseBills).values({
        companyId: DEMO_COMPANY_ID,
        billNumber,
        purchaseOrderId: input.purchaseOrderId || null,
        supplierId: input.supplierId,
        billDate: input.billDate,
        dueDate: input.dueDate,
        reference: input.reference,
        subtotal: subtotal.toFixed(2),
        taxAmount: taxTotal.toFixed(2),
        totalAmount: total.toFixed(2),
        paidAmount: "0",
        balanceAmount: total.toFixed(2),
        notes: input.notes,
        status: "draft",
      }).returning();

      // 2. Insert Bill Lines
      await tx.insert(purchaseBillLines).values(
        input.lines.map((line, index) => ({
          companyId: DEMO_COMPANY_ID,
          billId: bill.id,
          lineNumber: index + 1,
          purchaseOrderLineId: line.poLineId || null,
          itemId: line.itemId,
          quantity: line.quantity.toString(),
          unitPrice: line.unitPrice.toString(),
          taxAmount: (line.taxAmount || 0).toString(),
          lineTotal: (Number(line.quantity) * Number(line.unitPrice) + Number(line.taxAmount || 0)).toString(),
        }))
      );

      // 3. GL Posting: DR Expense/Inventory, DR VAT Input, CR Accounts Payable
      const coa = await tx.query.chartOfAccounts.findMany({
        where: eq(chartOfAccounts.companyId, DEMO_COMPANY_ID)
      });
      const getAccountId = (code: string) => coa.find(a => a.code === code)?.id;

      const apAccountId = getAccountId("2110"); // Accounts Payable
      const expenseAccountId = getAccountId("5100"); // COGS
      const taxAccountId = getAccountId("2120"); // VAT Payable

      if (apAccountId && expenseAccountId) {
        const journalNum = `JV-BILL-${Date.now()}`;

        const [journal] = await tx.insert(journalEntries).values({
          companyId: DEMO_COMPANY_ID,
          journalNumber: journalNum,
          journalDate: input.billDate,
          sourceDocType: "BILL",
          sourceDocId: bill.id,
          sourceDocNumber: billNumber,
          description: `Bill ${billNumber} from Supplier`,
          totalDebit: total.toFixed(2),
          totalCredit: total.toFixed(2),
          status: "posted",
        }).returning();

        // Credit AP (Total)
        await tx.insert(journalLines).values({
          companyId: DEMO_COMPANY_ID,
          journalId: journal.id,
          lineNumber: 1,
          accountId: apAccountId,
          description: `Payable - ${billNumber}`,
          debit: "0",
          credit: total.toFixed(2),
        });

        // Debit Expense (Subtotal)
        await tx.insert(journalLines).values({
          companyId: DEMO_COMPANY_ID,
          journalId: journal.id,
          lineNumber: 2,
          accountId: expenseAccountId,
          description: `Purchase Expense - ${billNumber}`,
          debit: subtotal.toFixed(2),
          credit: "0",
        });

        // Debit VAT (Tax)
        if (taxTotal > 0 && taxAccountId) {
          await tx.insert(journalLines).values({
            companyId: DEMO_COMPANY_ID,
            journalId: journal.id,
            lineNumber: 3,
            accountId: taxAccountId,
            description: `VAT Input - ${billNumber}`,
            debit: taxTotal.toFixed(2),
            credit: "0",
          });
        }
      }

      return { bill };
    });

    revalidatePath("/procurement/bills");
    return { success: true, message: `Purchase Bill ${billNumber} created`, data: { id: result.bill.id, billNumber } };
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to create purchase bill" };
  }
}
