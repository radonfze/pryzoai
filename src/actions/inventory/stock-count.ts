"use server";

import { db } from "@/db";
import { stockCounts, stockCountLines, stockLedger, items, stockTransactions } from "@/db/schema";
import { eq, and, desc, inArray, sql } from "drizzle-orm";
import { getCompanyId, getCompanyIdSafe, requirePermission, getUserId } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { logAuditAction } from "@/lib/services/audit-service";

// 1. Get Snapshot of Items in a Warehouse
export async function getSnapshotItems(warehouseId: string, categoryId?: string, brandId?: string) {
    const companyId = await getCompanyIdSafe();
    if (!companyId) return [];

    // Base query for stock ledger in this warehouse
    // We join with items to filter by category/brand and get names
    const ledgerItems = await db.select({
        itemId: stockLedger.itemId,
        quantityOnHand: stockLedger.quantityOnHand,
        itemCode: items.code,
        itemName: items.name,
        categoryName: items.categoryId, // In a real join we'd get name
    })
    .from(stockLedger)
    .innerJoin(items, eq(stockLedger.itemId, items.id))
    .where(and(
        eq(stockLedger.companyId, companyId),
        eq(stockLedger.warehouseId, warehouseId),
        categoryId ? eq(items.categoryId, categoryId) : undefined,
        brandId ? eq(items.brandId, brandId) : undefined,
        eq(items.isActive, true)
    ));
    
    return ledgerItems;
}

// 2. Create Stock Count (Draft)
export async function createStockCount(data: {
    warehouseId: string;
    description?: string;
    lines: { itemId: string; systemQty: number }[]
}) {
    const companyId = await getCompanyId();
    const userId = await getUserId();
    if (!companyId) return { success: false, message: "Unauthorized" };

    // Permission
    await requirePermission("inventory.count.create");

    try {
        const result = await db.transaction(async (tx) => {
            // Generate Number
            const countCount = await tx.select({ count: sql<number>`count(*)` }).from(stockCounts).where(eq(stockCounts.companyId, companyId));
            const countNumber = `CNT-${new Date().getFullYear()}-${1000 + (countCount[0]?.count || 0) + 1}`;

            const [newCount] = await tx.insert(stockCounts).values({
                companyId,
                warehouseId: data.warehouseId,
                countNumber,
                countDate: new Date().toISOString(), // Today
                description: data.description,
                status: "draft",
                createdBy: userId
            }).returning();

            if (data.lines.length > 0) {
                await tx.insert(stockCountLines).values(
                    data.lines.map(line => ({
                        companyId,
                        countId: newCount.id,
                        itemId: line.itemId,
                        systemQty: line.systemQty.toString(),
                        countedQty: "0", // Default to 0
                        varianceQty: (-line.systemQty).toString(), // Default variance logic
                    }))
                );
            }
            return newCount;
        });
        
        revalidatePath("/inventory/count");
        
        await logAuditAction({
            entityType: "stock_count",
            entityId: result.id,
            action: "CREATE",
            afterValue: { ...data, id: result.id }
        });

        return { success: true, id: result.id, message: "Stock count started" };

    } catch (error: any) {
        console.error("Create Count Error:", error);
        return { success: false, message: error.message };
    }
}

// 3. Update Stock Count (Save Progress)
export async function updateStockCount(id: string, lines: { itemId: string; countedQty: number }[]) {
    const companyId = await getCompanyId();
    if (!companyId) return { success: false, message: "Unauthorized" };

    await requirePermission("inventory.count.edit");
    
    try {
        await db.transaction(async (tx) => {
            for (const line of lines) {
                // Fetch current line to get systemQty
                const [currentLine] = await tx.select().from(stockCountLines)
                    .where(and(eq(stockCountLines.countId, id), eq(stockCountLines.itemId, line.itemId)));
                
                if (currentLine) {
                    const variance = line.countedQty - parseFloat(currentLine.systemQty || "0");
                    await tx.update(stockCountLines).set({
                        countedQty: line.countedQty.toString(),
                        varianceQty: variance.toString()
                    }).where(eq(stockCountLines.id, currentLine.id));
                }
            }
            
            await tx.update(stockCounts).set({
                status: "in_progress",
                updatedAt: new Date()
            }).where(eq(stockCounts.id, id));
        });
        
        revalidatePath(`/inventory/count/${id}`);
        return { success: true, message: "Stock count saved" };

    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

// 4. Post Stock Count (Finalize)
export async function postStockCount(id: string) {
    const companyId = await getCompanyId();
    const userId = await getUserId();
    if (!companyId) return { success: false, message: "Unauthorized" };

    await requirePermission("inventory.count.approve"); 

    try {
        const result = await db.transaction(async (tx) => {
            const [count] = await tx.select().from(stockCounts).where(and(eq(stockCounts.id, id), eq(stockCounts.companyId, companyId)));
            if (!count) throw new Error("Count not found");
            if (count.isPosted) throw new Error("Already posted");

            const lines = await tx.select().from(stockCountLines).where(eq(stockCountLines.countId, id));

            // Process Variances
            let varianceCount = 0;
            for (const line of lines) {
                const variance = parseFloat(line.varianceQty || "0");
                if (variance !== 0) {
                    varianceCount++;
                    const type = variance > 0 ? "adjustment_in" : "adjustment_out";
                    const absQty = Math.abs(variance);

                    // 1. Transaction
                    await tx.insert(stockTransactions).values({
                        companyId,
                        warehouseId: count.warehouseId,
                        itemId: line.itemId,
                        transactionType: type,
                        transactionDate: new Date(),
                        documentType: "stock_count",
                        documentId: count.id,
                        documentNumber: count.countNumber,
                        quantity: absQty.toString(),
                        uom: "UNIT", 
                        notes: `Stock Count Variance: ${variance}`,
                        createdBy: userId
                    });

                    // 2. Ledger Update
                    const [ledger] = await tx.select().from(stockLedger)
                        .where(and(eq(stockLedger.warehouseId, count.warehouseId), eq(stockLedger.itemId, line.itemId)));
                    
                    if (ledger) {
                        const newOnHand = parseFloat(ledger.quantityOnHand) + variance;
                        const newAvailable = parseFloat(ledger.quantityAvailable) + variance;
                        
                        await tx.update(stockLedger).set({
                            quantityOnHand: newOnHand.toString(),
                            quantityAvailable: newAvailable.toString(),
                            updatedAt: new Date()
                        }).where(eq(stockLedger.id, ledger.id));
                    }
                }
            }

            // Update Header
            await tx.update(stockCounts).set({
                status: "completed",
                isPosted: true,
                updatedAt: new Date()
            }).where(eq(stockCounts.id, id));
            
            return { varianceCount };
        });

        revalidatePath("/inventory/count");
        
        await logAuditAction({
            entityType: "stock_count",
            entityId: id,
            action: "APPROVE", 
            reason: `Posted with variances in ${result.varianceCount} lines`
        });

        return { success: true, message: "Stock count posted successfully" };

    } catch (error: any) {
        console.error("Post Count Error:", error);
        return { success: false, message: error.message };
    }
}

// 5. Delete Stock Count (Draft Only)
export async function deleteStockCount(id: string) {
    const companyId = await getCompanyId();
    if (!companyId) return { success: false, message: "Unauthorized" };

    await requirePermission("inventory.count.edit"); // Or delete permission if specific

    try {
        const [count] = await db.select().from(stockCounts).where(and(eq(stockCounts.id, id), eq(stockCounts.companyId, companyId)));
        
        if (!count) return { success: false, message: "Count not found" };
        if (count.status !== "draft") return { success: false, message: "Only draft counts can be deleted" };

        await db.transaction(async (tx) => {
            await tx.delete(stockCountLines).where(eq(stockCountLines.countId, id));
            await tx.delete(stockCounts).where(eq(stockCounts.id, id));
        });

        revalidatePath("/inventory/count");
        return { success: true, message: "Stock count deleted" };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

// 6. Revoke Stock Count (Reversal)
export async function revokeStockCount(id: string) {
    const companyId = await getCompanyId();
    const userId = await getUserId();
    if (!companyId) return { success: false, message: "Unauthorized" };

    await requirePermission("inventory.count.revoke");

    try {
        const result = await db.transaction(async (tx) => {
            const [count] = await tx.select().from(stockCounts).where(and(eq(stockCounts.id, id), eq(stockCounts.companyId, companyId)));
            
            if (!count) throw new Error("Count not found");
            if (!count.isPosted) throw new Error("Count is not posted");

            // Find original transactions
            const originalTx = await tx.select().from(stockTransactions)
                .where(and(
                    eq(stockTransactions.documentId, count.id),
                    eq(stockTransactions.documentType, "stock_count")
                ));
            
            // Create Reversal Transactions
            for (const orig of originalTx) {
                const reverseType = orig.transactionType === "adjustment_in" ? "adjustment_out" : "adjustment_in";
                 
                // 1. Transaction
                await tx.insert(stockTransactions).values({
                    companyId,
                    warehouseId: orig.warehouseId,
                    itemId: orig.itemId,
                    transactionType: reverseType,
                    transactionDate: new Date(),
                    documentType: "stock_count_revocation",
                    documentId: count.id,
                    documentNumber: `${count.countNumber}-REV`,
                    quantity: orig.quantity,
                    uom: orig.uom,
                    notes: `Revocation of Stock Count ${count.countNumber}`,
                    createdBy: userId
                });

                // 2. Ledger Update
                const variance = parseFloat(orig.quantity) * (reverseType === "adjustment_in" ? 1 : -1);
                
                const [ledger] = await tx.select().from(stockLedger)
                    .where(and(eq(stockLedger.warehouseId, orig.warehouseId), eq(stockLedger.itemId, orig.itemId)));
                
                if (ledger) {
                    const newOnHand = parseFloat(ledger.quantityOnHand) + variance;
                    const newAvailable = parseFloat(ledger.quantityAvailable) + variance;
                    
                    await tx.update(stockLedger).set({
                        quantityOnHand: newOnHand.toString(),
                        quantityAvailable: newAvailable.toString(),
                        updatedAt: new Date()
                    }).where(eq(stockLedger.id, ledger.id));
                }
            }

            // Update Header
            await tx.update(stockCounts).set({
                status: "cancelled", // or 'revoked' if enum allows
                updatedAt: new Date()
            }).where(eq(stockCounts.id, id));
        });

        revalidatePath("/inventory/count");
        revalidatePath(`/inventory/count/${id}`);

        await logAuditAction({
            entityType: "stock_count",
            entityId: id,
            action: "REVOKE",
            reason: "User requested revocation"
        });

        return { success: true, message: "Stock count revoked successfully" };

    } catch (error: any) {
        console.error("Revoke Count Error:", error);
        return { success: false, message: error.message };
    }
}
