import { db } from "@/db";
import { items, stockLedger, stockTransactions } from "@/db/schema";
import { eq, sql, and, lt, desc } from "drizzle-orm";

export interface InventoryStats {
  totalItems: number;
  lowStockItems: number;
  totalStockValue: number; // Sum of stockLedger.totalValue
  stockMovementsCount: number; // Recent activity
}

export async function getInventoryStats(companyId: string): Promise<InventoryStats> {
  // 1. Total Active Items
  const itemsCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(items)
    .where(and(eq(items.companyId, companyId), eq(items.isActive, true)));

  // 2. Low Stock Items (where quantityOnHand <= reorderLevel)
  const lowStockCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(stockLedger)
    .where(
      and(
        eq(stockLedger.companyId, companyId),
        sql`${stockLedger.quantityOnHand} <= ${stockLedger.reorderLevel}`,
        sql`${stockLedger.reorderLevel} > 0` // Only if reorder level is set
      )
    );

  // 3. Total Stock Value
  const valueResult = await db
    .select({ total: sql<number>`sum(${stockLedger.totalValue})` })
    .from(stockLedger)
    .where(eq(stockLedger.companyId, companyId));

  // 4. Movements in last 30 days (simplified to total count for now)
  const movementsCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(stockTransactions)
    .where(eq(stockTransactions.companyId, companyId));

  return {
    totalItems: Number(itemsCount[0]?.count || 0),
    lowStockItems: Number(lowStockCount[0]?.count || 0),
    totalStockValue: Number(valueResult[0]?.total || 0),
    stockMovementsCount: Number(movementsCount[0]?.count || 0),
  };
}

export async function getRecentStockMovements(companyId: string, limit = 5) {
  return await db.query.stockTransactions.findMany({
    where: eq(stockTransactions.companyId, companyId),
    with: {
      item: true,
      warehouse: true
    },
    orderBy: [desc(stockTransactions.transactionDate)],
    limit: limit,
  });
}
