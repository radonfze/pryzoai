"use server";

import { db } from "@/db";
import { purchaseOrders, goodsReceipts, purchaseInvoices } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface MatchResult {
    isMatch: boolean;
    discrepancies: string[];
    details: {
        poTotal: number;
        grnTotal: number;
        billTotal: number;
    };
}

/**
 * Validates a 3-way match between PO, GRN, and Bill.
 * Checks for Quantity and Amount discrepancies.
 */
export async function validateThreeWayMatch(billId: string, tolerance: number = 0.5): Promise<MatchResult> {
    
    // 1. Fetch Bill
    const bill = await db.query.purchaseInvoices.findFirst({
        where: eq(purchaseInvoices.id, billId),
        with: {
            lines: true,
            // We need to fetch related documents manually if relations aren't deep enough
        }
    });

    if (!bill) throw new Error("Bill not found");
    if (!bill.purchaseOrderId || !bill.grnId) {
        // If not linked, cannot perform 3-way match
        return { 
            isMatch: false, 
            discrepancies: ["Missing links to PO or GRN"], 
            details: { poTotal: 0, grnTotal: 0, billTotal: Number(bill.totalAmount) }
        };
    }

    // 2. Fetch Related PO and GRN
    const [po, grn] = await Promise.all([
        db.query.purchaseOrders.findFirst({
            where: eq(purchaseOrders.id, bill.purchaseOrderId),
            with: { lines: true }
        }),
        db.query.goodsReceipts.findFirst({
            where: eq(goodsReceipts.id, bill.grnId),
            with: { lines: true }
        })
    ]);

    if (!po || !grn) throw new Error("Related documents not found");

    const discrepancies: string[] = [];
    
    // 3. Check Totals (High Level)
    const billTotal = Number(bill.totalAmount);
    const poTotal = Number(po.totalAmount);
    // GRN often doesn't have total value if just qty, but our schema has 'totalValue'
    const grnTotal = Number(grn.totalValue);

    if (Math.abs(billTotal - poTotal) > tolerance) {
        discrepancies.push(`Bill Amount (${billTotal}) differs from PO Amount (${poTotal})`);
    }

    // 4. Check Quantities (Line Level Aggregation)
    // Simplified: Total Qty check
    const billQty = bill.lines.reduce((s, l) => s + Number(l.quantity), 0);
    const grnQty = Number(grn.totalQuantity); // Assuming GRN header stores total
    
    // Better: sum GRN lines
    const grnLineQty = grn.lines.reduce((s, l) => s + Number(l.quantity), 0);
    
    if (Math.abs(billQty - grnLineQty) > 0.01) {
         discrepancies.push(`Bill Quantity (${billQty}) differs from GRN Quantity (${grnLineQty})`);
    }

    return {
        isMatch: discrepancies.length === 0,
        discrepancies,
        details: { poTotal, grnTotal, billTotal }
    };
}
