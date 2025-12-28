"use server";

import { db } from "@/db";
import { purchaseBills, supplierPayments, suppliers } from "@/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";
import { getCompanyId } from "@/lib/auth";

export async function getSupplierStatement(supplierId: string, startDate: string, endDate: string) {
    try {
        const companyId = await getCompanyId();

        const supplier = await db.query.suppliers.findFirst({
            where: and(eq(suppliers.id, supplierId), eq(suppliers.companyId, companyId))
        });
        if (!supplier) throw new Error("Supplier not found");

        const bills = await db.query.purchaseBills.findMany({
            where: and(
                eq(purchaseBills.companyId, companyId),
                eq(purchaseBills.supplierId, supplierId),
                gte(purchaseBills.billDate, startDate),
                lte(purchaseBills.billDate, endDate)
            )
        });

        const payments = await db.query.supplierPayments.findMany({
            where: and(
                eq(supplierPayments.companyId, companyId),
                eq(supplierPayments.supplierId, supplierId),
                gte(supplierPayments.paymentDate, startDate),
                lte(supplierPayments.paymentDate, endDate)
            )
        });

        const transactions = [
            ...bills.map(b => ({ date: b.billDate, type: "BILL", ref: b.billNumber, dr: 0, cr: Number(b.totalAmount) })),
            ...payments.map(p => ({ date: p.paymentDate, type: "PAYMENT", ref: p.paymentNumber, dr: Number(p.amount), cr: 0 }))
        ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        let running = 0;
        const lines = transactions.map(t => {
            running += (t.cr - t.dr); // Liability increases with Credit (Bill), decreases with Debit (Payment)
            return { ...t, balance: running };
        });

        return {
            success: true,
            supplier,
            lines,
            closingBalance: running
        };

    } catch (e: any) {
        return { success: false, message: e.message };
    }
}
