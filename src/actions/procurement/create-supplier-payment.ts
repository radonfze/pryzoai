"use server";

import { db } from "@/db";
import { 
  supplierPayments, 
  purchaseInvoices, 
  numberSeries, 
  journalEntries, 
  journalLines, 
  chartOfAccounts, 
  suppliers
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ActionResponse = { success: boolean; message: string; data?: any };

export type SupplierPaymentInput = {
    supplierId: string;
    paymentDate: string;
    amount: number;
    paymentMethod: "cash" | "bank" | "cheque";
    reference?: string;
    notes?: string;
    billId?: string; // Optional: Pay specific bill
};

import { getCompanyId } from "@/lib/auth";

export async function createSupplierPaymentAction(input: SupplierPaymentInput): Promise<ActionResponse> {
    try {
        const companyId = await getCompanyId();
        if (!companyId) return { success: false, message: "Unauthorized" };
        const DEMO_COMPANY_ID = companyId;

        if (!input.supplierId || !input.amount || input.amount <= 0) {
            return { success: false, message: "Valid supplier and positive amount required" };
        }

        // 1. Generate Number
        const series = await db.query.numberSeries.findFirst({
            where: and(
                eq(numberSeries.companyId, DEMO_COMPANY_ID),
                eq(numberSeries.entityType, "payment_voucher"), // or supplier_payment
                eq(numberSeries.isActive, true)
            )
        });

        let paymentNumber = `PV-${Date.now()}`;
        if (series) {
            const nextVal = (series.currentValue || 0) + 1;
            const yearPart = series.yearFormat === "YYYY" ? new Date().getFullYear().toString() : "";
            paymentNumber = `${series.prefix}-${yearPart}-${nextVal.toString().padStart(5, '0')}`;
            await db.update(numberSeries).set({ currentValue: nextVal }).where(eq(numberSeries.id, series.id));
        }

        // 2. Create Payment Record
        const result = await db.transaction(async (tx) => {
            const [payment] = await tx.insert(supplierPayments).values({
                companyId: DEMO_COMPANY_ID,
                paymentNumber: paymentNumber,
                supplierId: input.supplierId,
                paymentDate: new Date(input.paymentDate),
                amount: input.amount.toFixed(2),
                paymentMethod: input.paymentMethod,
                reference: input.reference,
                notes: input.notes,
                status: "approved", // Auto-approve
                isPosted: false
            }).returning();

            // 3. Update Bill Status if Linked
            if (input.billId) {
                // Simplified: assuming full payment for now or manual allocation later
                // Logic to reduce bill balance would go here
            }

            // 4. GL Posting
            // DR: Accounts Payable (Liability Decreases) - 2110
            // CR: Bank/Cash (Asset Decreases) - 1110/1120

            const coa = await tx.query.chartOfAccounts.findMany({
                where: and(eq(chartOfAccounts.companyId, DEMO_COMPANY_ID))
            });
            const getAccountId = (code: string) => coa.find(a => a.code === code)?.id;

            const apAccountId = getAccountId("2110"); // Accounts Payable
            let bankAccountId = getAccountId("1120"); // Default Bank
            if (input.paymentMethod === "cash") {
                 bankAccountId = getAccountId("1110"); // Cash
            }

            if (apAccountId && bankAccountId) {
                const journalSeries = await tx.query.numberSeries.findFirst({
                   where: and(eq(numberSeries.companyId, DEMO_COMPANY_ID), eq(numberSeries.entityType, "journal"))
                });
                let journalNum = `JV-${Date.now()}`;
                if (journalSeries) {
                   const nextJv = (journalSeries.currentValue || 0) + 1;
                   journalNum = `${journalSeries.prefix}-${journalSeries.yearFormat === 'YYYY' ? new Date().getFullYear() : ''}-${nextJv.toString().padStart(5, '0')}`;
                   await tx.update(numberSeries).set({ currentValue: nextJv }).where(eq(numberSeries.id, journalSeries.id));
                }

                const [journal] = await tx.insert(journalEntries).values({
                    companyId: DEMO_COMPANY_ID,
                    journalNumber: journalNum,
                    journalDate: new Date(input.paymentDate),
                    sourceDocType: "SUPPLIER_PAYMENT",
                    sourceDocId: payment.id,
                    sourceDocNumber: paymentNumber,
                    description: `Payment to Supplier ${input.supplierId}`,
                    totalDebit: input.amount.toFixed(2),
                    totalCredit: input.amount.toFixed(2),
                    status: "posted"
                }).returning();

                // 1. Debit AP
                await tx.insert(journalLines).values({
                    companyId: DEMO_COMPANY_ID,
                    journalId: journal.id,
                    lineNumber: 1,
                    accountId: apAccountId,
                    description: `Payment Debit - ${paymentNumber}`,
                    debit: input.amount.toFixed(2),
                    credit: "0"
                });

                // 2. Credit Bank/Cash
                await tx.insert(journalLines).values({
                    companyId: DEMO_COMPANY_ID,
                    journalId: journal.id,
                    lineNumber: 2,
                    accountId: bankAccountId,
                    description: `Payment Out - ${paymentNumber}`,
                    debit: "0",
                    credit: input.amount.toFixed(2)
                });

                 await tx.update(supplierPayments).set({ isPosted: true }).where(eq(supplierPayments.id, payment.id));
            }

            return { payment };
        });

        revalidatePath("/procurement/payments");
        return { success: true, message: `Payment ${paymentNumber} recorded`, data: { id: result.payment.id } };

    } catch (error: any) {
        console.error("Create Supplier Payment Error:", error);
        return { success: false, message: error.message };
    }
}
