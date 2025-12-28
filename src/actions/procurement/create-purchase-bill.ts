"use server";

import { db } from "@/db";
import { purchaseBills, purchaseBillLines, purchaseOrders, numberSeries, journalEntries, journalLines, chartOfAccounts } from "@/db/schema";
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
      // 5. Automatic GL Posting (Purchase Bill)
      // DR: Inventory/Expense (1000/5000 based on nature, defaulting to Inventory 1200 or Expense 5000)
      // DR: VAT Input (Asset)
      // CR: Accounts Payable (Liability)

      const coa = await tx.query.chartOfAccounts.findMany({
        where: and(eq(chartOfAccounts.companyId, DEMO_COMPANY_ID))
      });
      const getAccountId = (code: string) => coa.find(a => a.code === code)?.id;

      // Default mappings (Should be configurable)
      const apAccountId = getAccountId("2110"); // Accounts Payable
      const inventoryAccountId = getAccountId("1200"); // Fixed Assets / Inventory placeholder (1200 is Fixed Assets in seed, need Inventory or Expense)
      // Let's use Expense 5100 (COGS) or 5200 (OpEx) for bills if not inventory. Assuming Inventory/Expense for now.
      // Better: if purchasing items, debit inventory/asset.
      const expenseAccountId = getAccountId("5100"); // COGS
      const taxAccountId = getAccountId("2120"); // VAT Payable (Should be VAT Input, but using same for now or 2xxx if we have it) 
      // Note: Seed has 2120 VAT Payable. Usually Input vs Output are separate. Using 2120 as net or just mapping for now.

      if (apAccountId && expenseAccountId) {
         // Create Journal
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
            journalDate: new Date(input.billDate),
            sourceDocType: "BILL",
            sourceDocId: bill.id,
            sourceDocNumber: billNumber,
            description: `Bill ${billNumber} from Supplier`,
            totalDebit: total.toFixed(2),
            totalCredit: total.toFixed(2),
            status: "posted",
         }).returning();

         // 1. Credit AP (Total Payable)
         await tx.insert(journalLines).values({
            companyId: DEMO_COMPANY_ID,
            journalId: journal.id,
            lineNumber: 1,
            accountId: apAccountId,
            description: `Payable - ${billNumber}`,
            debit: "0",
            credit: total.toFixed(2),
         });

         // 2. Debit Expense/Inventory (Subtotal)
         await tx.insert(journalLines).values({
            companyId: DEMO_COMPANY_ID,
            journalId: journal.id,
            lineNumber: 2,
            accountId: expenseAccountId,
            description: `Purchase Expense - ${billNumber}`,
            debit: subtotal.toFixed(2),
            credit: "0",
         });

         // 3. Debit Tax (Tax) - Wait, if we use VAT Payable for both, Debit reduces Payload?
         // Ideally should be VAT Receivable (Asset). 
         // For now, Debit 2120 (VAT Payable) reduces the liability (Netting off).
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
    return { success: false, message: error.message || "Failed" };
  }
}
