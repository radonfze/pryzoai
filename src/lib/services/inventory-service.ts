import { db } from "@/db";
import {
  inventoryReservations,
  stockLedger,
  stockTransactionTypeEnum,
} from "@/db/schema/inventory";
import { salesOrders, salesLines } from "@/db/schema/sales";
import { items } from "@/db/schema/items";
import { eq, and, sql } from "drizzle-orm";

export class InventoryService {
  /**
   * Reserve stock for a Sales Order.
   * Should be called when SO status changes to 'issued'.
   */
  static async reserveStockForOrder(orderId: string) {
    return await db.transaction(async (tx) => {
      // 1. Fetch Order and Lines
      const order = await tx.query.salesOrders.findFirst({
        where: eq(salesOrders.id, orderId),
        with: {
          lines: {
            with: {
              item: true,
            },
          },
        },
      });

      if (!order) throw new Error("Order not found");
      if (order.status !== "issued") {
          // Only reserve if issued. If draft/pending, do nothing.
          return; 
      }

      // 2. Iterate lines
      for (const line of order.lines) {
        // Skip non-stock items
        if (line.item?.itemType !== "stock") continue;
        if (!order.warehouseId) continue; // Cannot reserve without warehouse

        const qtyToReserve = Number(line.quantity);

        // 3. Create Reservation Record
        await tx.insert(inventoryReservations).values({
          companyId: order.companyId,
          warehouseId: order.warehouseId,
          itemId: line.itemId!,
          documentType: "sales_order",
          documentId: order.id,
          documentNumber: order.orderNumber,
          lineNumber: line.lineNumber.toString(),
          quantityReserved: qtyToReserve.toString(),
          quantityFulfilled: "0",
          status: "active",
        });

        // 4. Update Stock Ledger
        // Check if ledger entry exists
        const ledgerEntry = await tx.query.stockLedger.findFirst({
          where: and(
            eq(stockLedger.warehouseId, order.warehouseId),
            eq(stockLedger.itemId, line.itemId!)
          ),
        });

        if (ledgerEntry) {
          // Update existing
          await tx
            .update(stockLedger)
            .set({
              quantityReserved: sql`${stockLedger.quantityReserved} + ${qtyToReserve}`,
              quantityAvailable: sql`${stockLedger.quantityOnHand} - (${stockLedger.quantityReserved} + ${qtyToReserve})`,
              updatedAt: new Date(),
            })
            .where(eq(stockLedger.id, ledgerEntry.id));
        } else {
          // Create new ledger entry (initially 0 on hand, so available will be negative)
          // This allows "Overselling" / Backorders if configured, or just tracking deficit
          await tx.insert(stockLedger).values({
            companyId: order.companyId,
            warehouseId: order.warehouseId,
            itemId: line.itemId!,
            quantityOnHand: "0",
            quantityReserved: qtyToReserve.toString(),
            quantityAvailable: (-qtyToReserve).toString(),
            updatedAt: new Date(),
          });
        }
      }
    });
  }
}
