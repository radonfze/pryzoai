"use server";

import { db } from "@/db";
import { stockTransactions, items, warehouses, stockLedger } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { processStockMovement } from "@/lib/inventory/stock-service";

const adjustmentSchema = z.object({
  transactionDate: z.string(),
  reason: z.string().min(3),
  lines: z.array(z.object({
    itemId: z.string().uuid(),
    warehouseId: z.string().uuid(),
    quantity: z.number(), // Can be negative/positive
    notes: z.string().optional()
  })).min(1)
});

export async function createStockAdjustment(data: z.infer<typeof adjustmentSchema>, companyId: string, userId: string) {
  const result = adjustmentSchema.safeParse(data);
  if (!result.success) {
      return { success: false, error: result.error.flatten() };
  }

  const { lines, transactionDate, reason } = result.data;

  // Process each line as a stock movement
  for (const line of lines) {
       // Determine movement type based on quantity sign
       const movementType = line.quantity >= 0 ? "adjustment_in" : "adjustment_out";
       
       await processStockMovement({
           companyId,
           itemId: line.itemId,
           warehouseId: line.warehouseId,
           movementType, // Use movementType instead of transactionType
           quantity: Math.abs(line.quantity), // Always positive, direction from movementType
           uom: "PCS", // Default UOM
           userId, // Required by interface
           documentType: "SA", // Stock Adjustment
           documentNumber: `ADJ-${Date.now()}`,
           notes: line.notes || reason
       });
  }

  revalidatePath("/inventory/ledger");
  return { success: true };
}
