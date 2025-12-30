import { db } from "@/db";
import { stockLedger, stockTransactions, items } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

interface StockMovementParams {
  transactionType: 
    | "receipt" 
    | "issue" 
    | "transfer_out" 
    | "transfer_in" 
    | "adjustment_in" 
    | "adjustment_out" 
    | "return_in" 
    | "return_out" 
    | "production_in" 
    | "production_out";
  
  companyId: string;
  warehouseId: string;
  itemId: string;
  quantity: number; // Always positive value passed here, direction handled by type
  uom: string;
  
  documentType: "GRN" | "INV" | "ST" | "SA" | "RET" | "MFG";
  documentId: string;
  documentNumber: string;
  
  unitCost?: number; // Optional, will fetch from item/ledger if missing
  notes?: string;
  
  tx?: any; // Optional transaction context
}

/**
 * Core Service to handle ALL stock movements.
 * Updates Stock Ledger and Creates Transaction Log.
 */
export async function createStockMovement(params: StockMovementParams) {
  const { 
    transactionType, companyId, warehouseId, itemId, 
    quantity, uom, documentType, documentId, documentNumber,
    unitCost, notes, tx 
  } = params;

  // Use provided transaction or default db
  const database = tx || db;

  // 1. Determine direction and impact
  let quantityChange = 0;
  let valueChange = 0;
  
  switch (transactionType) {
    case "receipt":
    case "transfer_in":
    case "adjustment_in":
    case "return_in":
    case "production_in":
      quantityChange = quantity;
      break;
    case "issue":
    case "transfer_out":
    case "adjustment_out":
    case "return_out":
    case "production_out":
      quantityChange = -quantity;
      break;
  }

  // 2. Get Current Ledger State (or Create if missing)
  let ledger = await database.query.stockLedger.findFirst({
    where: and(
      eq(stockLedger.companyId, companyId),
      eq(stockLedger.warehouseId, warehouseId),
      eq(stockLedger.itemId, itemId)
    )
  });

  if (!ledger) {
    // Initial entry
    [ledger] = await database.insert(stockLedger).values({
        companyId,
        warehouseId,
        itemId,
        quantityOnHand: "0",
        quantityAvailable: "0",
        quantityReserved: "0",
        totalValue: "0",
        averageCost: "0"
    }).returning();
  }

  // 3. Calculate Cost (Weighted Average)
  let costPerUnit = unitCost;
  
  if (!costPerUnit) {
      if (quantityChange < 0) {
          // Issues use current Average Cost
         costPerUnit = Number(ledger.averageCost || 0);
      } else {
         // Receipts fallback to Item Cost if not provided
         const item = await database.query.items.findFirst({
             where: eq(items.id, itemId)
         });
         costPerUnit = Number(item?.costPrice || 0);
      }
  }

  // 4. Update Ledger
  // New Qty
  const currentQty = Number(ledger.quantityOnHand);
  const newQty = currentQty + quantityChange; 
  
  // New Value
  const currentValue = Number(ledger.totalValue);
  const transactionValue = Math.abs(quantityChange) * costPerUnit;
  let newValue = 0;
  
  if (quantityChange > 0) {
      newValue = currentValue + transactionValue;
  } else {
      // For issues, reduce value proportional to cost
      newValue = currentValue - (Math.abs(quantityChange) * Number(ledger.averageCost));
  }
  
  // Prevent excessive precision drift or negative value small errors
  if(newQty <= 0) newValue = 0;

  // Recalculate Average Cost
  let newAvgCost = 0;
  if(newQty > 0) {
      newAvgCost = newValue / newQty;
  } else {
      newAvgCost = Number(ledger.averageCost); // Retain last known cost if stock hits 0
  }

  await database.update(stockLedger)
    .set({
        quantityOnHand: newQty.toFixed(3),
        quantityAvailable: newQty.toFixed(3), // TODO: Handle reserved logic later
        totalValue: newValue.toFixed(2),
        averageCost: newAvgCost.toFixed(4),
        lastSaleDate: quantityChange < 0 ? new Date() : undefined,
        lastPurchaseDate: quantityChange > 0 ? new Date() : undefined,
        updatedAt: new Date()
    })
    .where(eq(stockLedger.id, ledger.id));

  // 5. Create Stock Transaction Log
  await database.insert(stockTransactions).values({
      companyId,
      warehouseId,
      itemId,
      transactionType,
      transactionDate: new Date(),
      documentType,
      documentId,
      documentNumber,
      quantity: quantity.toFixed(3), // Abs value stored
      uom,
      unitCost: costPerUnit.toFixed(4),
      totalCost: transactionValue.toFixed(2),
      balanceAfter: newQty.toFixed(3),
      notes
  });

  return { success: true, newQty, newAvgCost };
}
