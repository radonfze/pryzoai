import { db } from "@/db";
import { purchaseOrders } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";

export interface ProcurementStats {
  totalOrders: number;
  pendingAmount: number;
  openOrdersCount: number;
}

export async function getProcurementStats(companyId: string): Promise<ProcurementStats> {
  const totalCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(purchaseOrders)
    .where(eq(purchaseOrders.companyId, companyId));
    
  // Pending Amount (Draft or Ordered, not completed)
  const pendingResult = await db
    .select({ total: sql<number>`sum(${purchaseOrders.totalAmount})` })
    .from(purchaseOrders)
    .where(
        and(
            eq(purchaseOrders.companyId, companyId),
            sql`${purchaseOrders.status} NOT IN ('completed', 'cancelled')`
        )
    );

   const openCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(purchaseOrders)
    .where(
        and(
            eq(purchaseOrders.companyId, companyId),
            sql`${purchaseOrders.status} NOT IN ('completed', 'cancelled')`
        )
    );

  return {
    totalOrders: Number(totalCount[0]?.count || 0),
    pendingAmount: Number(pendingResult[0]?.total || 0),
    openOrdersCount: Number(openCount[0]?.count || 0),
  };
}
