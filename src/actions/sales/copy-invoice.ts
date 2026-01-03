"use server";

import { db } from "@/db";
import { 
  salesInvoices, 
  salesLines,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession, getCompanyId } from "@/lib/auth";
import { generateNextNumber } from "@/lib/services/number-generator";
import { logDocumentAction } from "@/lib/services/document-history-service";

export interface CopyInvoiceResult {
  success: boolean;
  message: string;
  newInvoiceId?: string;
  newInvoiceNumber?: string;
}

/**
 * Copy an existing invoice to create a new draft
 * Copies all line items but generates a new number and resets dates
 */
export async function copyInvoiceAction(sourceInvoiceId: string): Promise<CopyInvoiceResult> {
  try {
    const session = await getSession();
    const companyId = await getCompanyId();
    
    if (!companyId || !session?.userId) {
      return { success: false, message: "Unauthorized" };
    }

    // 1. Get source invoice with lines
    const sourceInvoice = await db.query.salesInvoices.findFirst({
      where: eq(salesInvoices.id, sourceInvoiceId),
      with: {
        lines: true,
      },
    });

    if (!sourceInvoice) {
      return { success: false, message: "Source invoice not found" };
    }

    // 2. Generate new invoice number
    const numResult = await generateNextNumber({
      companyId,
      entityType: "invoice",
      documentType: "INV",
    });

    if (!numResult.success || !numResult.number) {
      return { success: false, message: "Failed to generate invoice number" };
    }

    const newInvoiceNumber = numResult.number;
    const today = new Date().toISOString().split("T")[0];
    
    // Calculate due date (30 days from today or same offset as original)
    const originalDueDays = sourceInvoice.dueDate && sourceInvoice.invoiceDate
      ? Math.ceil((new Date(sourceInvoice.dueDate).getTime() - new Date(sourceInvoice.invoiceDate).getTime()) / (1000 * 60 * 60 * 24))
      : 30;
    const newDueDate = new Date();
    newDueDate.setDate(newDueDate.getDate() + originalDueDays);

    // 3. Create new invoice
    const [newInvoice] = await db.insert(salesInvoices).values({
      companyId,
      branchId: sourceInvoice.branchId,
      warehouseId: sourceInvoice.warehouseId,
      customerId: sourceInvoice.customerId,
      invoiceNumber: newInvoiceNumber,
      invoiceDate: today,
      dueDate: newDueDate.toISOString().split("T")[0],
      reference: `Copy of ${sourceInvoice.invoiceNumber}`,
      currencyId: sourceInvoice.currencyId,
      exchangeRate: sourceInvoice.exchangeRate,
      subtotal: sourceInvoice.subtotal,
      discountPercent: sourceInvoice.discountPercent,
      discountAmount: sourceInvoice.discountAmount,
      taxAmount: sourceInvoice.taxAmount,
      totalAmount: sourceInvoice.totalAmount,
      taxableAmount: sourceInvoice.taxableAmount,
      vatAmount: sourceInvoice.vatAmount,
      paymentTermsId: sourceInvoice.paymentTermsId,
      notes: sourceInvoice.notes,
      status: "draft",
      isPosted: false,
      paidAmount: "0",
      balanceAmount: sourceInvoice.totalAmount,
      createdBy: session.userId,
    }).returning();

    // 4. Copy line items
    const sourceLines = sourceInvoice.lines || [];
    if (sourceLines.length > 0) {
      await db.insert(salesLines).values(
        sourceLines.map((line, idx) => ({
          companyId,
          invoiceId: newInvoice.id,
          lineNumber: idx + 1,
          itemId: line.itemId,
          description: line.description,
          quantity: line.quantity,
          uom: line.uom,
          unitPrice: line.unitPrice,
          discountPercent: line.discountPercent,
          discountAmount: line.discountAmount,
          taxId: line.taxId,
          taxAmount: line.taxAmount,
          lineTotal: line.lineTotal,
        }))
      );
    }

    // 5. Log document history
    await logDocumentAction({
      documentId: newInvoice.id,
      documentType: "invoice",
      documentNumber: newInvoiceNumber,
      action: "CREATE",
      newValue: {
        copiedFrom: sourceInvoice.invoiceNumber,
        lineCount: sourceLines.length,
      },
    }, session.userId);

    return {
      success: true,
      message: `Invoice copied successfully as ${newInvoiceNumber}`,
      newInvoiceId: newInvoice.id,
      newInvoiceNumber,
    };

  } catch (error: any) {
    console.error("Copy invoice error:", error);
    return { success: false, message: error.message || "Failed to copy invoice" };
  }
}
