"use server";

import { db } from "@/db";
import { 
  goodsReceipts,
  goodsReceiptLines,
  purchaseOrders,
  purchaseOrderLines,
  companies,
  suppliers,
  items,
  warehouses,
  numberSeries
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ActionResponse = {
  success: boolean;
  message: string;
  data?: any;
};

type GRNLine = {
  poLineId?: string;
  itemId: string;
  description?: string;
  receivedQty: number;
  acceptedQty: number;
  rejectedQty: number;
  uom: string;
  unitPrice: number;
};

type GRNInput = {
  purchaseOrderId?: string;
  supplierId: string;
  warehouseId: string;
  receiptDate: string;
  reference?: string;
  notes?: string;
  lines: GRNLine[];
};

async function generateGRNNumber(companyId: string, receiptDate: Date): Promise<string> {
  const series = await db.query.numberSeries.findFirst({
    where: and(
      eq(numberSeries.companyId, companyId),
      eq(numberSeries.documentType, "grn"),
      eq(numberSeries.isActive, true)
    ),
  });

  if (!series) return `GRN-${Date.now()}`;

  const year = receiptDate.getFullYear();
  let yearPart = "";
  
  if (series.yearFormat === "YYYY") yearPart = year.toString();
  else if (series.yearFormat === "YY") yearPart = year.toString().slice(-2);

  const nextNumber = series.currentValue;
  
  await db.update(numberSeries)
    .set({ currentValue: nextNumber + 1, updatedAt: new Date() })
    .where(eq(numberSeries.id, series.id));

  const paddedNumber = nextNumber.toString().padStart(5, "0");
  const parts = [series.prefix];
  if (yearPart) parts.push(yearPart);
  parts.push(paddedNumber);

  return parts.join(series.separator || "-");
}

export async function createGRNAction(input: GRNInput): Promise<ActionResponse> {
  try {
    const DEMO_COMPANY_ID = "00000000-0000-0000-0000-000000000000";

    // Validation
    if (!input.supplierId) return { success: false, message: "Supplier is required" };
    if (!input.warehouseId) return { success: false, message: "Warehouse is required" };
    if (!input.receiptDate) return { success: false, message: "Receipt date is required" };
    if (!input.lines || input.lines.length === 0) {
      return { success: false, message: "At least one line item is required" };
    }

    // Validate quantities
    for (const line of input.lines) {
      if (Number(line.receivedQty) <= 0) {
        return { success: false, message: "Received quantity must be greater than zero" };
      }
      if (Number(line.acceptedQty) > Number(line.receivedQty)) {
        return { success: false, message: "Accepted quantity cannot exceed received quantity" };
      }
    }

    const receiptDate = new Date(input.receiptDate);
    const grnNumber = await generateGRNNumber(DEMO_COMPANY_ID, receiptDate);

    const result = await db.transaction(async (tx) => {
      // Insert GRN header
      const [grn] = await tx.insert(goodsReceipts).values({
        companyId: DEMO_COMPANY_ID,
        supplierId: input.supplierId,
        warehouseId: input.warehouseId,
        purchaseOrderId: input.purchaseOrderId,
        grnNumber,
        receiptDate: input.receiptDate,
        reference: input.reference,
        notes: input.notes,
        status: "draft",
        isPosted: false,
      }).returning();

      // Insert GRN lines
      await tx.insert(goodsReceiptLines).values(
        input.lines.map((line, index) => ({
          companyId: DEMO_COMPANY_ID,
          grnId: grn.id,
          lineNumber: index + 1,
          purchaseOrderLineId: line.poLineId,
          itemId: line.itemId,
          description: line.description || "",
          receivedQty: line.receivedQty.toString(),
          acceptedQty: line.acceptedQty.toString(),
          rejectedQty: line.rejectedQty.toString(),
          uom: line.uom,
          unitPrice: line.unitPrice.toString(),
        }))
      );

      // Update PO received quantities if linked
      if (input.purchaseOrderId) {
        for (const line of input.lines) {
          if (line.poLineId) {
            const poLine = await tx.query.purchaseOrderLines.findFirst({
              where: eq(purchaseOrderLines.id, line.poLineId),
            });

            if (poLine) {
              const newReceivedQty = Number(poLine.receivedQty || 0) + Number(line.acceptedQty);
              await tx.update(purchaseOrderLines)
                .set({
                  receivedQty: newReceivedQty.toString(),
                  updatedAt: new Date(),
                })
                .where(eq(purchaseOrderLines.id, line.poLineId));
            }
          }
        }

        // Update PO status if fully received
        const po = await tx.query.purchaseOrders.findFirst({
          where: eq(purchaseOrders.id, input.purchaseOrderId),
          with: { lines: true },
        });

        if (po) {
          const allReceived = po.lines.every(
            (line) => Number(line.receivedQty || 0) >= Number(line.quantity)
          );

          if (allReceived) {
            await tx.update(purchaseOrders)
              .set({ status: "received", updatedAt: new Date() })
              .where(eq(purchaseOrders.id, input.purchaseOrderId));
          } else {
            await tx.update(purchaseOrders)
              .set({ status: "partial", updatedAt: new Date() })
              .where(eq(purchaseOrders.id, input.purchaseOrderId));
          }
        }
      }

      return { grn };
    });

    revalidatePath("/procurement/grn");
    if (input.purchaseOrderId) {
      revalidatePath("/procurement/orders");
    }

    return {
      success: true,
      message: `GRN ${grnNumber} created successfully`,
      data: { id: result.grn.id, grnNumber },
    };
  } catch (error: any) {
    console.error("Create GRN error:", error);
    return { success: false, message: error.message || "Failed to create GRN" };
  }
}
