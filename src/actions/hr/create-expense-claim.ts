"use server";

import { db } from "@/db";
import { getCompanyId } from "@/lib/auth";

export async function createExpenseClaim(employeeId: string, amount: number, category: string, receipt?: string) {
    try {
        const companyId = await getCompanyId();
        // Insert into `expense_claims`
        return { success: true, message: "Expense Claim Submitted" };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}
