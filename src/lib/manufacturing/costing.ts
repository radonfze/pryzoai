import { db } from "@/db";
import { 
  productionOrders, 
  productionOrderComponents, 
  bomLines, 
  items,
  stockLedger
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export interface CostBreakdown {
  materialCost: number;
  laborCost: number; // Placeholder for now (Phase 2 feature usually)
  overheadCost: number; // Placeholder
  totalCost: number;
  unitCost: number;
}

/**
 * Manufacturing Costing Engine
 * Calculates the valuation of Finished Goods (FG) based on actual consumption.
 */
export async function calculateProductionCost(productionOrderId: string): Promise<CostBreakdown> {
  // 1. Get Production Order
  const po = await db.query.productionOrders.findFirst({
    where: eq(productionOrders.id, productionOrderId),
    with: {
      items: { // Components consumed
        with: {
            item: true
        }
      }
    }
  });

  if (!po) throw new Error("Production Order not found");

  // 2. Calculate Material Cost (Actual Consumption)
  let materialCost = 0;

  for (const component of po.items) {
    // Ideally, we look at the 'stock_transactions' related to this PO for EXACT cost
    // For MVP, we use the average cost from the Item Master or Stock Ledger
    
    // Fetch latest average cost from ledger (simplified)
    const ledgerEntry = await db.query.stockLedger.findFirst({
        where: eq(stockLedger.itemId, component.itemId),
    });

    const unitCost = Number(ledgerEntry?.averageCost || 0);
    const cost = Number(component.quantityConsumed) * unitCost;
    materialCost += cost;
  }

  // 3. Labor & Overhead (Fixed standard rate or based on routing time)
  // For MVP, lets assume a flat overhead percentage if defined, or 0.
  const overheadRate = 0; 
  const laborCost = 0;
  const overheadCost = materialCost * overheadRate;

  const totalCost = materialCost + laborCost + overheadCost;
  const unitCost = po.quantityProduced ? (totalCost / Number(po.quantityProduced)) : 0;

  return {
    materialCost,
    laborCost,
    overheadCost,
    totalCost,
    unitCost
  };
}
