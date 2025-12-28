"use server";

import { db } from "@/db";
import { inventoryReservations, stockLedger, items, warehouses } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCompanyId } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * RESERVE STOCK: Blocks quantity for a specific Order (SO/WO)
 * Updated for Phase 4: On-Click Reservation
 */
export async function reserveStock(
    itemId: string, 
    warehouseId: string, 
    quantity: number, 
    docType: string, 
    docId: string,
    docNumber: string
) {
    try {
        const companyId = await getCompanyId();

        // 1. Check Availability
        const ledger = await db.query.stockLedger.findFirst({
            where: and(
                eq(stockLedger.companyId, companyId),
                eq(stockLedger.warehouseId, warehouseId),
                eq(stockLedger.itemId, itemId)
            )
        });

        const available = Number(ledger?.quantityAvailable || 0);
        if (available < quantity) {
            return { success: false, message: `Insufficient stock. Available: ${available}, Requested: ${quantity}` };
        }

        // 2. Create Reservation Record
        await db.insert(inventoryReservations).values({
            companyId,
            warehouseId,
            itemId,
            documentType: docType,
            documentId: docId,
            documentNumber: docNumber,
            quantityReserved: quantity.toString(),
            status: "active",
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default 7 days expiry
        });

        // 3. Update Ledger (Increase Reserved, Decrease Available)
        // Note: available = onHand - reserved. So we just increase reserved.
        if (ledger) {
            await db.update(stockLedger).set({
                quantityReserved: (Number(ledger.quantityReserved) + quantity).toString(),
                quantityAvailable: (Number(ledger.quantityAvailable) - quantity).toString(), // derived
                updatedAt: new Date()
            }).where(eq(stockLedger.id, ledger.id));
        }

        revalidatePath("/inventory/stock");
        return { success: true, message: `Reserved ${quantity} units for ${docNumber}` };

    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

/**
 * RELEASE STOCK: Cancel/Expire reservation
 */
export async function releaseStock(reservationId: string) {
    // Logic to find reservation, revert ledger, update status to 'released'
    // ... Implementation would mirror reserve but reverse math
}
