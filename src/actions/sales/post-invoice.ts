"use server";

import { db } from "@/db";
import { salesInvoices, salesLines, customers, items, warehouses, defaultGlAccounts, stockLedger } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { postSalesInvoiceToGL } from "@/lib/services/gl-posting-service";
import { getCompanyId, requirePermission } from "@/lib/auth";
import { createStockMovement } from "@/lib/services/inventory-movement-service";

export async function postInvoiceAction(invoiceId: string) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return { success: false, message: "Unauthorized" };

    // Strict Permission Check
    try { await requirePermission("sales.invoices.edit"); }
    catch (e) { return { success: false, message: "Forbidden: You do not have permission to post invoices." }; }


    return await db.transaction(async (tx) => {
      // 1. Fetch Invoice
      const invoice = await tx.query.salesInvoices.findFirst({
        where: eq(salesInvoices.id, invoiceId),
        with: { lines: true }
      });

      if (!invoice) throw new Error("Invoice not found");
      if (invoice.isPosted) throw new Error("Invoice is already posted");

      // 2. Fetch GL Mapping
      const defaults = await tx.query.defaultGlAccounts.findMany({
          where: eq(defaultGlAccounts.companyId, companyId)
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

      if (!glMapping.salesRevenue || !glMapping.accountsReceivable) {
        throw new Error("Missing GL configuration for Sales/AR accounts");
      }

      // 3. Post to GL
      const glResult = await postSalesInvoiceToGL(
        invoice.id,
        invoice.invoiceNumber,
        new Date(invoice.invoiceDate),
        invoice.customerId,
        Number(invoice.subtotal),
        Number(invoice.taxAmount),
        Number(invoice.totalAmount),
        glMapping,
        tx
      );

      if (!glResult.success) {
        throw new Error(`GL Posting Failed: ${glResult.error}`);
      }

      // 4. Update Inventory (Issue Stock)
      // Note: If invoice was created as 'draft', stock might not have been deducted yet.
      // We assume 'posting' triggers the stock deduction if not already done.
      // Ideally, we check a flag like 'isStockDeducted', but 'isPosted' usually covers both financial + stock impact.
      
      for (const line of invoice.lines) {
          await createStockMovement({
              transactionType: "issue",
              companyId,
              warehouseId: invoice.warehouseId,
              itemId: line.itemId,
              quantity: Number(line.quantity),
              uom: "PCS",
              documentType: "INV",
              documentId: invoice.id,
              documentNumber: invoice.invoiceNumber,
              notes: `Invoice Posted: ${invoice.invoiceNumber}`,
              tx 
          });
      }

      // 5. Update Status
      await tx.update(salesInvoices)
        .set({ 
            isPosted: true, 
            status: "issued" // Change from draft -> issued
        })
        .where(eq(salesInvoices.id, invoiceId));

      revalidatePath(`/sales/invoices/${invoiceId}`);
      revalidatePath("/sales/invoices");

      return { success: true, message: "Invoice posted successfully (GL + Stock updated)" };
    });

  } catch (error: any) {
    console.error("Post Invoice Error:", error);
    return { success: false, message: error.message };
  }
}
