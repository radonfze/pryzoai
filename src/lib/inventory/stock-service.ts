/**
 * Stock Movement Service
 * 
 * Handles all inventory movements with full audit trail.
 * Maintains stock ledger and supports FIFO/Weighted Average valuation.
 */

import { db } from "@/db";
import { stockLedger, stockTransactions, stockBatches, inventoryReservations } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { createAuditLog } from "@/lib/audit";

export type MovementType = 
  | "receipt"
  | "issue"
  | "transfer_out"
  | "transfer_in"
  | "adjustment_in"
  | "adjustment_out"
  | "return_in"
  | "return_out";

export interface StockMovement {
  companyId: string;
  warehouseId: string;
  itemId: string;
  movementType: MovementType;
  quantity: number;
  uom: string;
  unitCost?: number;
  documentType?: string;
  documentId?: string;
  documentNumber?: string;
  batchId?: string;
  serialId?: string;
  userId: string;
  notes?: string;
}

export interface MovementResult {
  success: boolean;
  transactionId?: string;
  newBalance?: number;
  error?: string;
}

/**
 * Process a stock movement and update ledger
 */
export async function processStockMovement(movement: StockMovement): Promise<MovementResult> {
  try {
    const isInward = ["receipt", "transfer_in", "adjustment_in", "return_in", "production_in"].includes(movement.movementType);
    const adjustedQty = isInward ? movement.quantity : -movement.quantity;

    // Get or create stock ledger entry
    let ledger = await db
      .select()
      .from(stockLedger)
      .where(
        and(
          eq(stockLedger.companyId, movement.companyId),
          eq(stockLedger.warehouseId, movement.warehouseId),
          eq(stockLedger.itemId, movement.itemId)
        )
      )
      .limit(1);

    let currentBalance = 0;
    let currentAvgCost = 0;

    if (ledger.length === 0) {
      // Create new ledger entry
      const [newLedger] = await db
        .insert(stockLedger)
        .values({
          companyId: movement.companyId,
          warehouseId: movement.warehouseId,
          itemId: movement.itemId,
          quantityOnHand: "0",
          quantityReserved: "0",
          quantityAvailable: "0",
          averageCost: "0",
          totalValue: "0",
        })
        .returning();
      
      ledger = [newLedger];
    } else {
      currentBalance = Number(ledger[0].quantityOnHand);
      currentAvgCost = Number(ledger[0].averageCost);
    }

    // Calculate new balance
    const newBalance = currentBalance + adjustedQty;

    if (newBalance < 0) {
      return {
        success: false,
        error: `Insufficient stock. Current: ${currentBalance}, Required: ${movement.quantity}`,
      };
    }

    // Calculate weighted average cost for receipts
    let newAvgCost = currentAvgCost;
    if (isInward && movement.unitCost) {
      const currentValue = currentBalance * currentAvgCost;
      const incomingValue = movement.quantity * movement.unitCost;
      newAvgCost = newBalance > 0 ? (currentValue + incomingValue) / newBalance : movement.unitCost;
    }

    // Update ledger
    await db
      .update(stockLedger)
      .set({
        quantityOnHand: String(newBalance),
        quantityAvailable: String(newBalance - Number(ledger[0].quantityReserved)),
        averageCost: String(newAvgCost),
        totalValue: String(newBalance * newAvgCost),
        updatedAt: new Date(),
        ...(isInward && movement.documentType === "GRN" ? { lastPurchaseDate: new Date() } : {}),
        ...(!isInward && movement.documentType === "INV" ? { lastSaleDate: new Date() } : {}),
      })
      .where(eq(stockLedger.id, ledger[0].id));

    // Create transaction record
    const [transaction] = await db
      .insert(stockTransactions)
      .values({
        companyId: movement.companyId,
        warehouseId: movement.warehouseId,
        itemId: movement.itemId,
        transactionType: movement.movementType,
        transactionDate: new Date(),
        documentType: movement.documentType,
        documentId: movement.documentId,
        documentNumber: movement.documentNumber,
        quantity: String(adjustedQty),
        uom: movement.uom,
        unitCost: movement.unitCost ? String(movement.unitCost) : null,
        totalCost: movement.unitCost ? String(Math.abs(adjustedQty) * movement.unitCost) : null,
        balanceAfter: String(newBalance),
        batchId: movement.batchId,
        serialId: movement.serialId,
        createdBy: movement.userId,
        notes: movement.notes,
      })
      .returning();

    // Audit log
    await createAuditLog({
      companyId: movement.companyId,
      userId: movement.userId,
      entityType: "stock_transaction",
      entityId: transaction.id,
      action: "CREATE",
      afterValue: {
        movementType: movement.movementType,
        itemId: movement.itemId,
        quantity: adjustedQty,
        newBalance,
        documentNumber: movement.documentNumber,
      },
    });

    return {
      success: true,
      transactionId: transaction.id,
      newBalance,
    };
  } catch (error) {
    console.error("Stock movement error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Movement failed",
    };
  }
}

/**
 * Reserve stock for a sales order
 */
export async function reserveStock(
  companyId: string,
  warehouseId: string,
  itemId: string,
  quantity: number,
  documentType: string,
  documentId: string,
  documentNumber: string,
  userId: string,
  expiresAt?: Date
): Promise<{ success: boolean; reservationId?: string; error?: string }> {
  try {
    // Check available quantity
    const [ledger] = await db
      .select()
      .from(stockLedger)
      .where(
        and(
          eq(stockLedger.companyId, companyId),
          eq(stockLedger.warehouseId, warehouseId),
          eq(stockLedger.itemId, itemId)
        )
      )
      .limit(1);

    if (!ledger) {
      return { success: false, error: "Item not found in warehouse" };
    }

    const available = Number(ledger.quantityAvailable);
    if (available < quantity) {
      return { success: false, error: `Insufficient available stock. Available: ${available}` };
    }

    // Create reservation
    const [reservation] = await db
      .insert(inventoryReservations)
      .values({
        companyId,
        warehouseId,
        itemId,
        documentType,
        documentId,
        documentNumber,
        quantityReserved: String(quantity),
        expiresAt,
        createdBy: userId,
      })
      .returning();

    // Update ledger reserved quantity
    await db
      .update(stockLedger)
      .set({
        quantityReserved: String(Number(ledger.quantityReserved) + quantity),
        quantityAvailable: String(Number(ledger.quantityAvailable) - quantity),
        updatedAt: new Date(),
      })
      .where(eq(stockLedger.id, ledger.id));

    return { success: true, reservationId: reservation.id };
  } catch (error) {
    console.error("Reservation error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Reservation failed" };
  }
}

/**
 * Release a reservation (cancel, expire, or fulfill)
 */
export async function releaseReservation(
  reservationId: string,
  status: "fulfilled" | "released" | "expired"
): Promise<{ success: boolean; error?: string }> {
  try {
    const [reservation] = await db
      .select()
      .from(inventoryReservations)
      .where(eq(inventoryReservations.id, reservationId))
      .limit(1);

    if (!reservation || reservation.status !== "active") {
      return { success: false, error: "Reservation not found or already processed" };
    }

    // Update reservation status
    await db
      .update(inventoryReservations)
      .set({ status, updatedAt: new Date() })
      .where(eq(inventoryReservations.id, reservationId));

    // Release reserved quantity back to available (unless fulfilled)
    if (status !== "fulfilled") {
      await db
        .update(stockLedger)
        .set({
          quantityReserved: sql`quantity_reserved - ${reservation.quantityReserved}`,
          quantityAvailable: sql`quantity_available + ${reservation.quantityReserved}`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(stockLedger.companyId, reservation.companyId),
            eq(stockLedger.warehouseId, reservation.warehouseId),
            eq(stockLedger.itemId, reservation.itemId)
          )
        );
    }

    return { success: true };
  } catch (error) {
    console.error("Release reservation error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Release failed" };
  }
}

/**
 * Get current stock for an item across warehouses
 */
export async function getItemStock(companyId: string, itemId: string): Promise<{
  warehouseId: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  averageCost: number;
}[]> {
  const result = await db
    .select()
    .from(stockLedger)
    .where(
      and(
        eq(stockLedger.companyId, companyId),
        eq(stockLedger.itemId, itemId)
      )
    );

  return result.map((r) => ({
    warehouseId: r.warehouseId,
    quantityOnHand: Number(r.quantityOnHand),
    quantityReserved: Number(r.quantityReserved),
    quantityAvailable: Number(r.quantityAvailable),
    averageCost: Number(r.averageCost),
  }));
}
