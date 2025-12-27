import { db } from "@/db";
import { inventoryReservations, items, warehouses } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";

export interface ReservedStockEntry {
  reservationId: string;
  itemCode: string; // from relations
  itemName: string; // from relations
  warehouseName: string; // from relations
  documentNumber: string | null;
  quantityReserved: number;
  status: string;
  expiresAt: Date | null;
  reservedAt: Date;
}

/**
 * Generates a report of all currently active reserved stock.
 * Filters out expired or fulfilled reservations.
 */
export async function getReservedStockReport(
  companyId: string,
  warehouseId?: string
): Promise<ReservedStockEntry[]> {
  const conditions = [
    eq(inventoryReservations.companyId, companyId),
    eq(inventoryReservations.status, "active"),
  ];

  if (warehouseId) {
    conditions.push(eq(inventoryReservations.warehouseId, warehouseId));
  }

  // Drizzle query
  const results = await db.query.inventoryReservations.findMany({
    where: and(...conditions),
    with: {
      item: true,
      warehouse: true,
    },
    orderBy: (reservations, { desc }) => [desc(reservations.createdAt)],
  });

  // Map to report format
  return results.map((r) => ({
    reservationId: r.id,
    itemCode: r.item.code,
    itemName: r.item.name,
    warehouseName: r.warehouse.name,
    documentNumber: r.documentNumber,
    quantityReserved: Number(r.quantityReserved),
    status: r.status,
    expiresAt: r.expiresAt,
    reservedAt: r.createdAt,
  }));
}

/**
 * getAggregatedReservedStock
 * Returns total reserved quantity per item.
 */
export async function getAggregatedReservedStock(companyId: string) {
  // Aggregate logic (simplified fetch-and-reduce for MVP, ideal is SQL sum)
  const report = await getReservedStockReport(companyId);
  
  const aggregation: Record<string, number> = {};
  
  for (const entry of report) {
    if (!aggregation[entry.itemCode]) aggregation[entry.itemCode] = 0;
    aggregation[entry.itemCode] += entry.quantityReserved;
  }
  
  return aggregation;
}
