"use server";

import { db } from "@/db";
import { inventoryReservations, stockLedger, items, warehouses } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getCompanyId, getCompanyIdSafe, requirePermission } from "@/lib/auth";
import { logAuditAction } from "@/lib/services/audit-service";
import { revalidatePath } from "next/cache";

/**
 * GET RESERVATIONS: Fetch all reservations for the company
 */
export async function getReservations() {
    const companyId = await getCompanyIdSafe();
    if (!companyId) return [];

    return db.query.inventoryReservations.findMany({
        where: eq(inventoryReservations.companyId, companyId),
        with: {
            item: true,
            warehouse: true,
            project: true,
            customer: true,
        },
        orderBy: [desc(inventoryReservations.createdAt)],
    });
}

/**
 * GET RESERVATION BY ID
 */
export async function getReservationById(id: string) {
    const companyId = await getCompanyIdSafe();
    if (!companyId) return null;

    return db.query.inventoryReservations.findFirst({
        where: and(eq(inventoryReservations.id, id), eq(inventoryReservations.companyId, companyId)),
        with: {
            item: true,
            warehouse: true,
            project: true,
            customer: true,
        },
    });
}

/**
 * RESERVE STOCK: Blocks quantity for a specific Order (SO/WO)
 */
export async function reserveStock(
    itemId: string, 
    warehouseId: string, 
    quantity: number, 
    docType: string, 
    docId: string,
    docNumber: string,
    options?: {
        projectId?: string;
        customerId?: string;
        reservedPrice?: number;
        expiresAt?: Date;
    }
) {
    try {
        const companyId = await getCompanyId();
        
        // Security Check
        await requirePermission("inventory.items.manage");

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
        const [reservation] = await db.insert(inventoryReservations).values({
            companyId,
            warehouseId,
            itemId,
            documentType: docType,
            documentId: docId,
            documentNumber: docNumber,
            quantityReserved: quantity.toString(),
            status: "active",
            projectId: options?.projectId,
            customerId: options?.customerId,
            reservedPrice: options?.reservedPrice?.toString(),
            expiresAt: options?.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default 7 days expiry
        }).returning();

        // 3. Update Ledger (Increase Reserved, Decrease Available)
        if (ledger) {
            await db.update(stockLedger).set({
                quantityReserved: (Number(ledger.quantityReserved) + quantity).toString(),
                quantityAvailable: (Number(ledger.quantityAvailable) - quantity).toString(),
                updatedAt: new Date()
            }).where(eq(stockLedger.id, ledger.id));
        }

        revalidatePath("/inventory/reservations");
        revalidatePath("/inventory/items");
        
        // Audit Log
        await logAuditAction({
            entityType: "reservation",
            entityId: reservation.id,
            action: "CREATE",
            afterValue: { itemId, warehouseId, quantity, docNumber }
        });

        return { success: true, message: `Reserved ${quantity} units for ${docNumber}`, id: reservation.id };

    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

/**
 * RELEASE STOCK: Cancel/Expire reservation and restore ledger
 */
export async function releaseStock(reservationId: string) {
    try {
        const companyId = await getCompanyId();
        
        // Security Check
        await requirePermission("inventory.items.manage");
        
        // 1. Find the reservation
        const reservation = await db.query.inventoryReservations.findFirst({
            where: and(
                eq(inventoryReservations.id, reservationId),
                eq(inventoryReservations.companyId, companyId)
            )
        });

        if (!reservation) {
            return { success: false, message: "Reservation not found" };
        }

        if (reservation.status !== "active") {
            return { success: false, message: `Cannot release reservation with status: ${reservation.status}` };
        }

        const quantityToRelease = Number(reservation.quantityReserved) - Number(reservation.quantityFulfilled || 0);

        if (quantityToRelease <= 0) {
            // Already fully fulfilled
            await db.update(inventoryReservations)
                .set({ status: "fulfilled", updatedAt: new Date() })
                .where(eq(inventoryReservations.id, reservationId));
            
            revalidatePath("/inventory/reservations");
            return { success: true, message: "Reservation already fulfilled" };
        }

        // 2. Find and update ledger
        const ledger = await db.query.stockLedger.findFirst({
            where: and(
                eq(stockLedger.companyId, companyId),
                eq(stockLedger.warehouseId, reservation.warehouseId),
                eq(stockLedger.itemId, reservation.itemId)
            )
        });

        if (ledger) {
            await db.update(stockLedger).set({
                quantityReserved: Math.max(0, Number(ledger.quantityReserved) - quantityToRelease).toString(),
                quantityAvailable: (Number(ledger.quantityAvailable) + quantityToRelease).toString(),
                updatedAt: new Date()
            }).where(eq(stockLedger.id, ledger.id));
        }

        // 3. Update reservation status
        await db.update(inventoryReservations)
            .set({ status: "released", updatedAt: new Date() })
            .where(eq(inventoryReservations.id, reservationId));

        revalidatePath("/inventory/reservations");
        revalidatePath("/inventory/items");

        // Audit Log
        await logAuditAction({
            entityType: "reservation",
            entityId: reservationId,
            action: "CANCEL", // Release is essentially a cancel or update
            reason: "Manual Release"
        });

        return { success: true, message: `Released ${quantityToRelease} units back to available stock` };

    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

/**
 * FULFILL RESERVATION: Mark quantity as used/shipped
 */
export async function fulfillReservation(reservationId: string, quantityFulfilled: number) {
    try {
        const companyId = await getCompanyId();
        
        // Security Check (fulfillment might be separate strictly, but for now reuse manage)
        await requirePermission("inventory.items.manage");

        const reservation = await db.query.inventoryReservations.findFirst({
            where: and(
                eq(inventoryReservations.id, reservationId),
                eq(inventoryReservations.companyId, companyId)
            )
        });

        if (!reservation) {
            return { success: false, message: "Reservation not found" };
        }

        const currentFulfilled = Number(reservation.quantityFulfilled || 0);
        const reserved = Number(reservation.quantityReserved);
        const newFulfilled = currentFulfilled + quantityFulfilled;

        if (newFulfilled > reserved) {
            return { success: false, message: "Cannot fulfill more than reserved quantity" };
        }

        const newStatus = newFulfilled >= reserved ? "fulfilled" : "active";

        await db.update(inventoryReservations)
            .set({ 
                quantityFulfilled: newFulfilled.toString(),
                status: newStatus,
                updatedAt: new Date()
            })
            .where(eq(inventoryReservations.id, reservationId));

        revalidatePath("/inventory/reservations");

        // Audit Log
        await logAuditAction({
            entityType: "reservation",
            entityId: reservationId,
            action: "UPDATE",
            reason: `Fulfilled ${quantityFulfilled}`,
            afterValue: { quantityFulfilled, status: newStatus }
        });

        return { success: true, message: `Fulfilled ${quantityFulfilled} units`, status: newStatus };

    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

