"use server";

import { db } from "@/db";
import { purchaseOrders, purchaseLines } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createPoSchema = z.object({
  supplierId: z.string().uuid(),
  orderDate: z.string(), // ISO Date
  deliveryDate: z.string().optional(),
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

  const { supplierId, orderDate, deliveryDate, items, notes } = result.data;
  
  // 1. Calculate Totals
  let subtotal = 0;
  let totalTax = 0;
  const lines = items.map((item, index) => {
    const lineTotal = item.quantity * item.unitPrice;
    const taxAmount = lineTotal * (item.vatRate / 100);
    subtotal += lineTotal;
    totalTax += taxAmount;
    return { ...item, lineTotal, taxAmount, lineNumber: index + 1 };
  });
  const totalAmount = subtotal + totalTax;

  // 2. Insert PO Header (field names match schema/purchase.ts)
  const [po] = await db.insert(purchaseOrders).values({
    companyId,
    supplierId,
    orderNumber: `PO-${Date.now()}`, // Required by schema
    orderDate, // Schema uses orderDate (string date)
    deliveryDate: deliveryDate || null,
    subtotal: subtotal.toFixed(2),
    taxAmount: totalTax.toFixed(2),
    totalAmount: totalAmount.toFixed(2),
    status: "draft",
    notes
  }).returning();

  // 3. Insert Lines (field names match schema/purchase.ts)
  if (lines.length > 0) {
      await db.insert(purchaseLines).values(
          lines.map(line => ({
              companyId,
              purchaseOrderId: po.id,
              lineNumber: line.lineNumber, // Required by schema
              itemId: line.itemId,
              quantity: line.quantity.toString(),
              uom: "PCS", // Required by schema
              unitPrice: line.unitPrice.toString(),
              taxAmount: line.taxAmount.toString(),
              lineTotal: line.lineTotal.toString(),
          }))
      );
  }

  revalidatePath("/procurement/orders");
  return { success: true, id: po.id };
}
