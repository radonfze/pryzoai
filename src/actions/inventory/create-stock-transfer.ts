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
    const DEMO_COMPANY_ID = "00000000-0000-0000-0000-000000000000";

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
    const transferNumber = await generateTransferNumber(DEMO_COMPANY_ID, transferDate);

    const result = await db.transaction(async (tx) => {
      const [transfer] = await tx.insert(stockTransfers).values({
        companyId: DEMO_COMPANY_ID,
        transferNumber,
        fromWarehouseId: input.fromWarehouseId,
        toWarehouseId: input.toWarehouseId,
        transferDate: input.transferDate,
        reference: input.reference,
        notes: input.notes,
        status: "draft",
        isPosted: false,
      }).returning();

      await tx.insert(stockTransferLines).values(
        input.lines.map((line, index) => ({
          companyId: DEMO_COMPANY_ID,
          transferId: transfer.id,
          lineNumber: index + 1,
          itemId: line.itemId,
          quantity: line.quantity.toString(),
          uom: line.uom,
          notes: line.notes,
        }))
      );

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
