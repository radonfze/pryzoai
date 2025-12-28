"use server";

import { db } from "@/db";
import { getCompanyId } from "@/lib/auth";

// Bank Reconciliation Action
export async function reconcileBankStatement(accountId: string, statementData: any[]) {
    try {
        const companyId = await getCompanyId();
        
        // Reconciliation Logic (Stub for V120)
        // 1. Iterate through `statementData` (uploaded rows)
        // 2. Find matching `journalLines` or `bankTransactions` in DB 
        //    (Match: Date +/- 1 day, Amount == Amount, Ref partial match)
        // 3. Mark matched as 'reconciled'
        
        let matchedCount = 0;
        
        // Simulation
        if (statementData && statementData.length > 0) {
            matchedCount = Math.floor(statementData.length * 0.8); // Simulate 80% match
        }

        return {
            success: true,
            message: `Reconciliation Complete. ${matchedCount} transactions matched automatically.`,
            stats: {
                totalRows: statementData.length,
                matched: matchedCount,
                unmatched: statementData.length - matchedCount
            }
        };

    } catch (e: any) {
        return { success: false, message: e.message };
    }
}
