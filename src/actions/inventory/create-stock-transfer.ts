"use server";

import { db } from "@/db";
import { 
  stockTransfers,
  stockTransferLines,
  warehouses,
  items,
  numberSeries
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCompanyId } from "@/lib/auth";
import { createStockMovement } from "@/lib/services/inventory-movement-service";

export type ActionResponse = {
  success: boolean;
  message: string;
  data?: any;
};

type TransferLine = {
  itemId: string;
  quantity: number;
  uom: string;
  notes?: string;
};

type StockTransferInput = {
  fromWarehouseId: string;
  toWarehouseId: string;
  transferDate: string;
  reference?: string;
  notes?: string;
  lines: TransferLine[];
};

async function generateTransferNumber(companyId: string, transferDate: Date): Promise<string> {
  const series = await db.query.numberSeries.findFirst({
    where: and(
      eq(numberSeries.companyId, companyId),
      eq(numberSeries.documentType, "stock_transfer"),
      eq(numberSeries.isActive, true)
    ),
  });

  if (!series) return `ST-${Date.now()}`;

  const year = transferDate.getFullYear();
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

export async function createStockTransferAction(input: StockTransferInput): Promise<ActionResponse> {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return { success: false, message: "Unauthorized" };

    if (!input.fromWarehouseId) return { success: false, message: "Source warehouse is required" };
    if (!input.toWarehouseId) return { success: false, message: "Destination warehouse is required" };
    if (input.fromWarehouseId === input.toWarehouseId) {
      return { success: false, message: "Source and destination warehouses must be different" };
    }
    if (!input.transferDate) return { success: false, message: "Transfer date is required" };
    if (!input.lines || input.lines.length === 0) {
      return { success: false, message: "At least one item is required" };
    }

    const transferDate = new Date(input.transferDate);
    const transferNumber = await generateTransferNumber(companyId, transferDate);

    const result = await db.transaction(async (tx) => {
      // 1. Create Header
      const [transfer] = await tx.insert(stockTransfers).values({
        companyId,
        transferNumber,
        fromWarehouseId: input.fromWarehouseId,
        toWarehouseId: input.toWarehouseId,
        transferDate: input.transferDate,
        reference: input.reference,
        notes: input.notes,
        status: "completed", // Auto-complete for now to trigger movement immediately
        isPosted: true,
      }).returning();

      // 2. Create Lines & Move Stock
      for (const [index, line] of input.lines.entries()) {
          // Insert Line
          await tx.insert(stockTransferLines).values({
            companyId,
            transferId: transfer.id,
            lineNumber: index + 1,
            itemId: line.itemId,
            quantity: line.quantity.toString(),
            uom: line.uom,
            notes: line.notes,
          });

          // Move Stock OUT from Source
          await createStockMovement({
              companyId,
              warehouseId: input.fromWarehouseId,
              itemId: line.itemId,
              transactionType: "transfer_out",
              quantityChange: -Math.abs(line.quantity), // Negative
              documentType: "stock_transfer",
              documentId: transfer.id,
              documentNumber: transferNumber,
              reference: `Transfer to ${input.toWarehouseId}`, // Ideally warehouse Name
              transactionDate: transferDate
          }, tx);

          // Move Stock IN to Destination
          await createStockMovement({
            companyId,
            warehouseId: input.toWarehouseId,
            itemId: line.itemId,
            transactionType: "transfer_in",
            quantityChange: Math.abs(line.quantity), // Positive
            documentType: "stock_transfer",
            documentId: transfer.id,
            documentNumber: transferNumber,
            reference: `Transfer from ${input.fromWarehouseId}`,
            transactionDate: transferDate
        }, tx);
      }

      return { transfer };
    });

    revalidatePath("/inventory/transfers");

    return {
      success: true,
      message: `Stock Transfer ${transferNumber} created successfully`,
      data: { id: result.transfer.id, transferNumber },
    };
  } catch (error: any) {
    console.error("Create stock transfer error:", error);
    return { success: false, message: error.message || "Failed to create stock transfer" };
  }
}
