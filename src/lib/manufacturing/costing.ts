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
  // 1. Get Production Order with components (schema uses 'components' relation)
  const po = await db.query.productionOrders.findFirst({
    where: eq(productionOrders.id, productionOrderId),
    with: {
      components: { // Components consumed - per schema relation name
        with: {
            // Component has componentItemId, we need to get item details
        }
      }
    }
  });

  if (!po) throw new Error("Production Order not found");

  // 2. Calculate Material Cost (Actual Consumption)
  let materialCost = 0;

  for (const component of po.components) {
    // Ideally, we look at the 'stock_transactions' related to this PO for EXACT cost
    // For MVP, we use the average cost from the Item Master or Stock Ledger
    
    // Fetch latest average cost from ledger (simplified)
    const ledgerEntry = await db.query.stockLedger.findFirst({
        where: eq(stockLedger.itemId, component.componentItemId),
    });

    const unitCost = Number(ledgerEntry?.averageCost || 0);
    // Schema uses issuedQuantity for consumed amount
    const cost = Number(component.issuedQuantity || 0) * unitCost;
    materialCost += cost;
  }

  // 3. Labor & Overhead (Fixed standard rate or based on routing time)
  // For MVP, lets assume a flat overhead percentage if defined, or 0.
  const overheadRate = 0; 
  const laborCost = 0;
  const overheadCost = materialCost * overheadRate;

  const totalCost = materialCost + laborCost + overheadCost;
  // Schema uses producedQuantity not quantityProduced
  const unitCost = po.producedQuantity ? (totalCost / Number(po.producedQuantity)) : 0;

  return {
    materialCost,
    laborCost,
    overheadCost,
    totalCost,
    unitCost
  };
}
