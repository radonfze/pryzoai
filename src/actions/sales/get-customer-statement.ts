"use server";

import { db } from "@/db";
import { salesInvoices, customerPayments, salesReturns, customers } from "@/db/schema";
import { and, eq, gte, lte, asc, desc } from "drizzle-orm";
import { getCompanyId } from "@/lib/auth";

export async function getCustomerStatement(customerId: string, startDate: string, endDate: string) {
    try {
        const companyId = await getCompanyId();

        // 1. Fetch Customer Details
        const customer = await db.query.customers.findFirst({
            where: and(eq(customers.id, customerId), eq(customers.companyId, companyId))
        });
        if (!customer) throw new Error("Customer not found");

        // 2. Fetch Transactions
        // In a real optimized system, we might use a UNION query or specialized view.
        // For V120, we fetch and merge in application logic.
        
        const invoices = await db.query.salesInvoices.findMany({
            where: and(
                eq(salesInvoices.companyId, companyId),
                eq(salesInvoices.customerId, customerId),
                gte(salesInvoices.invoiceDate, startDate),
                lte(salesInvoices.invoiceDate, endDate)
            )
        });

        const payments = await db.query.customerPayments.findMany({
            where: and(
                eq(customerPayments.companyId, companyId),
                eq(customerPayments.customerId, customerId),
                gte(customerPayments.paymentDate, startDate),
                lte(customerPayments.paymentDate, endDate)
            )
        });

        // 3. Normalize & Sort
        const transactions = [
            ...invoices.map(i => ({
                date: i.invoiceDate,
                type: "INVOICE",
                reference: i.invoiceNumber,
                debit: Number(i.totalAmount),
                credit: 0
            })),
            ...payments.map(p => ({
                date: p.paymentDate,
                type: "PAYMENT",
                reference: p.paymentNumber,
                debit: 0,
                credit: Number(p.amount)
            }))
        ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // 4. Calculate Running Balance
        let balance = 0; // Opening balance logic would go here (fetch sum of prev transactions)
        const statementLines = transactions.map(t => {
            balance += (t.debit - t.credit);
            return { ...t, balance };
        });

        return {
            success: true,
            customer,
            period: { startDate, endDate },
            openiningBalance: 0, // Placeholder
            lines: statementLines,
            closingBalance: balance
        };

    } catch (e: any) {
        return { success: false, message: e.message };
    }
}
