"use server";

import { db } from "@/db";
import { 
  salesQuotations, 
  salesOrders, 
  salesLines,
  numberSeries 
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCompanyId, getSession } from "@/lib/auth";
import { checkPermission } from "@/lib/auth/permissions";

export type ConvertQuotationResponse = {
  success: boolean;
  message: string;
  orderId?: string;
  orderNumber?: string;
};

/**
 * Convert a Sales Quotation to a Sales Order
 * - Copies all line items
 * - Links order back to quotation
 * - Updates quotation convertedToSo flag
 */
export async function convertQuotationToOrder(quotationId: string): Promise<ConvertQuotationResponse> {
  try {
    // 1. Auth check
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }

    const hasPermission = await checkPermission(session.user.id, "sales.create");
    if (!hasPermission) {
      return { success: false, message: "Permission denied: You cannot create sales orders" };
    }

    const companyId = await getCompanyId();
    if (!companyId) {
      return { success: false, message: "No active company" };
    }

    // 2. Get quotation with lines
    const quotation = await db.query.salesQuotations.findFirst({
      where: and(
        eq(salesQuotations.id, quotationId),
        eq(salesQuotations.companyId, companyId)
      ),
      with: {
        lines: true,
        customer: true,
      }
    });

    if (!quotation) {
      return { success: false, message: "Quotation not found" };
    }

    // 3. Check if already converted
    if (quotation.convertedToSo) {
      return { success: false, message: "This quotation has already been converted to an order" };
    }

    // 4. Generate order number
    const series = await db.query.numberSeries.findFirst({
      where: and(
        eq(numberSeries.companyId, companyId),
        eq(numberSeries.entityType, "sales_order"),
        eq(numberSeries.isActive, true)
      )
    });

    let orderNumber = `SO-${Date.now()}`;
    if (series) {
      const nextVal = (series.currentValue || 0) + 1;
      const yearPart = series.yearFormat === "YYYY" ? new Date().getFullYear().toString() : "";
      orderNumber = `${series.prefix}${yearPart ? "-" + yearPart : ""}-${nextVal.toString().padStart(5, "0")}`;
      await db.update(numberSeries).set({ currentValue: nextVal }).where(eq(numberSeries.id, series.id));
    }

    // 5. Transaction: Create order + lines + update quotation
    const result = await db.transaction(async (tx) => {
      // Create Sales Order
      const [newOrder] = await tx.insert(salesOrders).values({
        companyId: companyId,
        branchId: quotation.branchId,
        warehouseId: null, // Will be set during fulfillment
        customerId: quotation.customerId,
        quotationId: quotationId, // Link back to quotation
        orderNumber: orderNumber,
        orderDate: new Date().toISOString().split("T")[0],
        deliveryDate: quotation.validUntil || null,
        reference: `Converted from ${quotation.quotationNumber}`,
        currencyId: quotation.currencyId,
        exchangeRate: quotation.exchangeRate,
        subtotal: quotation.subtotal,
        discountPercent: quotation.discountPercent,
        discountAmount: quotation.discountAmount,
        taxAmount: quotation.taxAmount,
        totalAmount: quotation.totalAmount,
        paymentTermsId: quotation.paymentTermsId,
        notes: quotation.notes,
        status: "draft",
        createdBy: session.user.id,
      }).returning();

      // Copy line items
      if (quotation.lines && quotation.lines.length > 0) {
        await tx.insert(salesLines).values(
          quotation.lines.map((line: any) => ({
            companyId: companyId,
            salesOrderId: newOrder.id, // Link to new order
            lineNumber: line.lineNumber,
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

      // Update quotation: mark as converted
      await tx.update(salesQuotations)
        .set({
          convertedToSo: true,
          status: "completed",
          updatedAt: new Date(),
        })
        .where(eq(salesQuotations.id, quotationId));

      return { order: newOrder };
    });

    // 6. Revalidate paths
    revalidatePath("/sales/quotations");
    revalidatePath("/sales/orders");

    return {
      success: true,
      message: `Successfully converted to Sales Order ${orderNumber}`,
      orderId: result.order.id,
      orderNumber: orderNumber,
    };

  } catch (error: any) {
    console.error("Convert quotation error:", error);
    return { success: false, message: error.message || "Failed to convert quotation" };
  }
}
