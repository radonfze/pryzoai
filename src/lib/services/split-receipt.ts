"use server";

import { db } from "@/db";
import { chartOfAccounts, journalEntries, journalLines } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCompanyId } from "@/lib/auth";

/**
 * SPLIT RECEIPT POSTING (Phase 5: Finance)
 * Handles Receipts that split into: Revenue (Company) + Govt Fees (Liability) + VAT
 * Example: Visa Visa Service -> 
 *  - Customer Pays: 1050
 *  - Revenue: 500
 *  - Govt Fee (Trust Account): 500 (Pass-through)
 *  - VAT: 50 (on Revenue only)
 */
export async function postSplitReceipt(
    docNumber: string,
    totalReceived: number,
    revenueAmount: number,
    govtFeeAmount: number,
    vatAmount: number,
    customerId: string
) {
    try {
        const companyId = await getCompanyId();

        // Fetch Accounts (Dynamic or Fixed for this logic)
        // Ideally look up from Settings, simplified here for engine logic verification
        const coa = await db.query.chartOfAccounts.findMany({ where: eq(chartOfAccounts.companyId, companyId) });
        const getAcct = (code: string) => coa.find(a => a.code === code)?.id;

        const cashAcct = getAcct("1110"); // Cash/Bank
        const revenueAcct = getAcct("4100"); // Service Revenue
        const vatAcct = getAcct("2130"); // VAT Payable
        const govtFeeAcct = getAcct("2200"); // Accrued Liabilities (Trust Account for Govt Fees)

        if (!cashAcct || !revenueAcct || !vatAcct || !govtFeeAcct) {
            throw new Error("Missing GL Configuration for Split Receipt");
        }

        const [journal] = await db.insert(journalEntries).values({
            companyId,
            journalNumber: `RV-${docNumber}`,
            journalDate: new Date().toISOString(),
            description: `Split Receipt - ${docNumber}`,
            totalDebit: totalReceived.toString(),
            totalCredit: totalReceived.toString(),
            status: "posted"
        }).returning();

        // 1. DR Cash (Total Received)
        await db.insert(journalLines).values({
            companyId, journalId: journal.id, lineNumber: 1, accountId: cashAcct,
            description: "Collection", debit: totalReceived.toString(), credit: "0"
        });

        // 2. CR Revenue (Net Income)
        if (revenueAmount > 0) {
            await db.insert(journalLines).values({
                companyId, journalId: journal.id, lineNumber: 2, accountId: revenueAcct,
                description: "Service Revenue", debit: "0", credit: revenueAmount.toString()
            });
        }

        // 3. CR Govt Fee Liability (Pass-through) -> KEY LOGIC
        if (govtFeeAmount > 0) {
             await db.insert(journalLines).values({
                companyId, journalId: journal.id, lineNumber: 3, accountId: govtFeeAcct,
                description: "Govt Fee Trust Liability", debit: "0", credit: govtFeeAmount.toString()
            });
        }

        // 4. CR VAT Output
        if (vatAmount > 0) {
             await db.insert(journalLines).values({
                companyId, journalId: journal.id, lineNumber: 4, accountId: vatAcct,
                description: "VAT Output", debit: "0", credit: vatAmount.toString()
            });
        }

        return { success: true, message: "Split Receipt Posted Successfully" };

    } catch (e: any) {
        return { success: false, message: e.message };
    }
}
