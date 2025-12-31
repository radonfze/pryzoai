"use server";

import { db } from "@/db";
import { stockLedger, items, warehouses } from "@/db/schema";
import { eq, desc, and, gt } from "drizzle-orm";
import { getCompanyId } from "@/lib/auth";

export interface StockValuationParams {
  warehouseId?: string; // Optional filter
  hideZeroStock?: boolean;
}

export async function getStockValuation(params?: StockValuationParams) {
  const companyId = await getCompanyId();
  if (!companyId) return { data: [], totals: {} };

  const conditions = [eq(stockLedger.companyId, companyId)];
  
  if (params?.warehouseId && params.warehouseId !== "all") {
    conditions.push(eq(stockLedger.warehouseId, params.warehouseId));
  }
  
  if (params?.hideZeroStock) {
      conditions.push(gt(stockLedger.quantityOnHand, "0"));
  }

  const data = await db.query.stockLedger.findMany({
    where: and(...conditions),
    with: {
      item: true,
      warehouse: true
    },
    orderBy: [desc(stockLedger.totalValue)]
  });

  // Calculate Aggregates
  const totals = data.reduce((acc, curr) => ({
      totalValue: acc.totalValue + Number(curr.totalValue || 0),
      totalItems: acc.totalItems + 1,
      totalQty: acc.totalQty + Number(curr.quantityOnHand || 0)
  }), { totalValue: 0, totalItems: 0, totalQty: 0 });

  return { data, totals };
}
