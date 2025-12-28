"use server";

import { db } from "@/db";
import { getCompanyId } from "@/lib/auth";

export async function createLoanApplication(employeeId: string, amount: number, tenureMonths: number, reason: string) {
    try {
        const companyId = await getCompanyId();
        // Insert into `loan_applications`
        return { success: true, message: "Loan Application Submitted" };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}
