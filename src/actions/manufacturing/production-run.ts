"use server";

import { db } from "@/db";
import { productionOrders, productionOrderComponents, items, journalEntries, journalLines, chartOfAccounts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCompanyId } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * PRODUCTION RUN: Updates inventory and costs.
 * 1. Backflush Materials (Issue raw material)
 * 2. Receive Finished Goods
 * 3. Post Journals (WIP)
 */
export async function completeProductionOrder(orderId: string, quantityProduced: number) {
    try {
        const companyId = await getCompanyId();

        const order = await db.query.productionOrders.findFirst({
            where: and(eq(productionOrders.id, orderId), eq(productionOrders.companyId, companyId)),
            with: { components: true, bom: true }
        });

        if (!order) throw new Error("Order not found");

        // 1. Calculated Costs
        // For MVP, we use estimated cost from BOM as 'Standard Cost'
        const unitCost = Number(order.bom?.totalCost || 0);
        const totalProductionCost = unitCost * quantityProduced;

        // 2. Backflush Components (Reduce Stock)
        // In real system: Create Stock Entry (Issue). For stats: just update issued quantity.
        for (const comp of order.components) {
            const consumed = (Number(comp.requiredQuantity) / Number(order.plannedQuantity)) * quantityProduced;
            await db.update(productionOrderComponents)
                .set({ issuedQuantity: (Number(comp.issuedQuantity) + consumed).toString() })
                .where(eq(productionOrderComponents.id, comp.id));
        }

        // 3. Update Order Status
        await db.update(productionOrders).set({
            status: "completed",
            producedQuantity: quantityProduced.toString(),
            actualEndDate: new Date().toISOString(),
            actualCost: totalProductionCost.toString()
        }).where(eq(productionOrders.id, orderId));

        // 4. GL Posting (WIP Accounting)
        // DR Finished Goods Inventory
        // CR WIP Account (Or Raw Material Inventory directly if backflushing)
        
        // Simplified Backflush: DR Inventory(FG), CR Inventory(RM)
        // (Skipping intermediate WIP step for simplicity unless requested)
        
        const coa = await db.query.chartOfAccounts.findMany({ where: eq(chartOfAccounts.companyId, companyId) });
        const getAcct = (code: string) => coa.find(a => a.code === code)?.id;

        const fgInventoryId = getAcct("1410"); // Finished Goods
        const rmInventoryId = getAcct("1420"); // Raw Material

        if (fgInventoryId && rmInventoryId) {
             const [journal] = await db.insert(journalEntries).values({
                companyId,
                journalNumber: `JV-PROD-${order.orderNumber}`,
                journalDate: new Date().toISOString(),
                description: `Production Completion ${order.orderNumber}`,
                totalDebit: totalProductionCost.toFixed(2),
                totalCredit: totalProductionCost.toFixed(2),
                status: "posted"
             }).returning();

             // DR Finished Goods
             await db.insert(journalLines).values({
                    companyId, journalId: journal.id, lineNumber: 1, accountId: fgInventoryId,
                    description: `Stock In - ${order.orderNumber}`, debit: totalProductionCost.toFixed(2), credit: "0"
             });

             // CR Raw Materials (Consumption)
             await db.insert(journalLines).values({
                    companyId, journalId: journal.id, lineNumber: 2, accountId: rmInventoryId,
                    description: `Material Consumption`, debit: "0", credit: totalProductionCost.toFixed(2)
             });
        }

        revalidatePath("/manufacturing/orders");
        return { success: true, message: `Production order completed. Cost: ${totalProductionCost}` };

    } catch (e: any) {
        return { success: false, message: e.message };
    }
}
