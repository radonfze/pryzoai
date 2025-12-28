"use server";

import { db } from "@/db";
import { 
  deliveryNotes, 
  deliveryNoteLines, 
  salesOrders, 
  salesOrderLines,
  items, 
  numberSeries,
  inventoryTransactions,
  warehouses
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ActionResponse = { success: boolean; message: string; data?: any };

export type DeliveryNoteLineInput = {
    salesOrderLineId?: string; // Link to SO Line
    itemId: string;
    description: string;
    quantity: number;
    uom?: string;
};

export type DeliveryNoteInput = {
    customerId: string;
    salesOrderId?: string;
    deliveryDate: string;
    warehouseId: string;
    lines: DeliveryNoteLineInput[];
    notes?: string;
    shippingAddress?: string;
};

export async function createDeliveryNoteAction(input: DeliveryNoteInput): Promise<ActionResponse> {
    try {
        const DEMO_COMPANY_ID = "00000000-0000-0000-0000-000000000000";

        if (!input.customerId || !input.lines.length || !input.warehouseId) {
            return { success: false, message: "Customer, Warehouse, and Lines are required" };
        }

        // 1. Generate Number
        const series = await db.query.numberSeries.findFirst({
            where: and(
                eq(numberSeries.companyId, DEMO_COMPANY_ID),
                eq(numberSeries.entityType, "delivery_note"),
                eq(numberSeries.isActive, true)
            )
        });

        let dnNumber = `DN-${Date.now()}`;
        if (series) {
            const nextVal = (series.currentValue || 0) + 1;
            const yearPart = series.yearFormat === "YYYY" ? new Date().getFullYear().toString() : "";
            dnNumber = `${series.prefix}-${yearPart}-${nextVal.toString().padStart(5, '0')}`;
            await db.update(numberSeries).set({ currentValue: nextVal }).where(eq(numberSeries.id, series.id));
        }

        // 2. Transaction
        const result = await db.transaction(async (tx) => {
            // Header
            const [dn] = await tx.insert(deliveryNotes).values({
                companyId: DEMO_COMPANY_ID,
                deliveryNoteNumber: dnNumber,
                customerId: input.customerId,
                salesOrderId: input.salesOrderId,
                deliveryDate: new Date(input.deliveryDate),
                warehouseId: input.warehouseId,
                shippingAddress: input.shippingAddress,
                status: "draft", // Draft until validated? Or direct to 'delivered' if we want speed. Let's say 'delivered' for immediate stock effect.
                notes: input.notes,
            }).returning();

            // Lines
            if (input.lines.length > 0) {
                 await tx.insert(deliveryNoteLines).values(
                    input.lines.map((l, i) => ({
                        companyId: DEMO_COMPANY_ID,
                        deliveryNoteId: dn.id,
                        lineNumber: i + 1,
                        salesOrderLineId: l.salesOrderLineId,
                        itemId: l.itemId,
                        description: l.description,
                        quantity: l.quantity.toString(),
                        uom: l.uom || "PCS"
                    }))
                );

                // 3. Inventory Impact (Deduct Stock)
                for (const line of input.lines) {
                    // Update Item Stock
                    const item = await tx.query.items.findFirst({
                        where: eq(items.id, line.itemId)
                    });

                    if (item) {
                        const newStock = Number(item.stockQuantity || 0) - Number(line.quantity);
                        await tx.update(items)
                            .set({ stockQuantity: newStock.toString() })
                            .where(eq(items.id, line.itemId));
                        
                        // Create Ledger Entry
                        await tx.insert(inventoryTransactions).values({
                            companyId: DEMO_COMPANY_ID,
                            transactionDate: new Date(input.deliveryDate),
                            itemId: line.itemId,
                            warehouseId: input.warehouseId,
                            transactionType: "OUT",
                            documentType: "DN",
                            documentId: dn.id,
                            documentNumber: dnNumber,
                            quantity: line.quantity.toString(), // Store as positive or negative? Usually positive for qty, direction by type.
                            unitCost: item.costPrice || "0", // Should be FIFO/Avg cost ideally
                            totalValue: (Number(line.quantity) * Number(item.costPrice || 0)).toString(),
                            reference: `Delivery for ${input.customerId}`
                        });
                    }
                    
                    // Update SO Delivered Qty
                    if (line.salesOrderLineId) {
                         // Need schema support for deliveredQty in salesOrderLines. Assuming not there yet, skip or implement later.
                    }
                }
            }

            return { dn };
        });

        revalidatePath("/inventory/ledger");
        revalidatePath("/sales/orders"); 
        
        return { success: true, message: `Delivery Note ${dnNumber} created`, data: { id: result.dn.id } };

    } catch (error: any) {
        console.error("Create DN Error:", error);
        return { success: false, message: error.message };
    }
}
