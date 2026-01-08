"use server";

import { db } from "@/db";
import { purchaseInvoices, defaultGlAccounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { postPurchaseBillToGL } from "@/lib/services/gl-posting-service";
import { getCompanyId } from "@/lib/auth";

export async function postPurchaseBillToGLAction(billId: string) {
  try {
    const companyId = "00000000-0000-0000-0000-000000000000"; // Fixed for now as per other files

    // 1. Fetch Bill
    const bill = await db.query.purchaseInvoices.findFirst({
      where: eq(purchaseInvoices.id, billId),
    });

    if (!bill) {
      return { success: false, message: "Bill not found" };
    }

    if (bill.status === "posted") {
        return { success: false, message: "Bill is already posted" };
    }

    // 2. Fetch GL Mapping
    const defaults = await db.query.defaultGlAccounts.findMany({
      where: eq(defaultGlAccounts.companyId, companyId),
    });
    const getDef = (key: string) => defaults.find((d) => d.mappingKey === key)?.accountId;

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
      payrollPayable: getDef("PAYROLL_PAYABLE") || "",
    };

    // 3. Post to GL
    const result = await postPurchaseBillToGL(
      bill.id,
      bill.invoiceNumber,
      new Date(bill.invoiceDate),
      bill.supplierId,
      Number(bill.subtotal),
      Number(bill.taxAmount),
      Number(bill.totalAmount),
      glMapping
    );

    if (!result.success) {
      return { success: false, message: result.error || "Failed to post to GL" };
    }

    // 4. Update Bill Status
    await db
      .update(purchaseInvoices)
      .set({ 
          status: "posted",
          isPosted: true,
          updatedAt: new Date()
      })
      .where(eq(purchaseInvoices.id, billId));

    revalidatePath("/procurement/bills");
    return { success: true, message: "Posted to GL successfully" };
  } catch (error: any) {
    console.error("Post to GL Error:", error);
    return { success: false, message: error.message || "Failed to post to GL" };
  }
}
