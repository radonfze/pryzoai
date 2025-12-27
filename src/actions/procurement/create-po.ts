"use server";

import { db } from "@/db";
import { purchaseOrders, purchaseLines } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { env } from "@/lib/env";

const createPoSchema = z.object({
  supplierId: z.string().uuid(),
  transactionDate: z.string(), // ISO Date
  dueDate: z.string(),
  items: z.array(z.object({
    itemId: z.string().uuid(),
    quantity: z.number().min(0.01),
    unitPrice: z.number().min(0),
    vatRate: z.number().min(0),
  })).min(1),
  notes: z.string().optional(),
});

export async function createPurchaseOrder(data: z.infer<typeof createPoSchema>, companyId: string) {
  const result = createPoSchema.safeParse(data);
  if (!result.success) {
    return { success: false, error: result.error.flatten() };
  }

  const { supplierId, transactionDate, dueDate, items, notes } = result.data;
  
  // 1. Calculate Totals
  let totalAmount = 0;
  let totalVat = 0;
  // TODO: Use Tax Engine for precise calc
  const lines = items.map(item => {
    const lineTotal = item.quantity * item.unitPrice;
    const vatAmount = lineTotal * (item.vatRate / 100);
    totalAmount += lineTotal + vatAmount;
    totalVat += vatAmount;
    return { ...item, lineTotal, vatAmount };
  });

  // 2. Insert PO Header
  const [po] = await db.insert(purchaseOrders).values({
    companyId,
    supplierId,
    transactionDate: new Date(transactionDate),
    dueDate: new Date(dueDate),
    totalAmount: totalAmount.toFixed(2), // Stored as decimal string
    status: "draft", // Starts as draft
    currencyCode: "AED",
    exchangeRate: "1",
    notes
  }).returning();

  // 3. Insert Lines
  if (lines.length > 0) {
      await db.insert(purchaseLines).values(
          lines.map(line => ({
              companyId,
              purchaseOrderId: po.id,
              itemId: line.itemId,
              quantity: line.quantity.toString(),
              unitPrice: line.unitPrice.toString(),
              taxAmount: line.vatAmount.toString(),
              lineTotal: line.lineTotal.toString(),
              vatRate: line.vatRate.toString(), // TODO: Add to schema if missing or mapping
              description: "Item purchase"
          }))
      );
  }

  revalidatePath("/procurement/orders");
  return { success: true, id: po.id };
}
