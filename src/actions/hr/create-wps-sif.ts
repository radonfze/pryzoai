"use server";

import { db } from "@/db";
import { employees } from "@/db/schema"; // Assuming basic employee schema
import { generateWpsSif } from "@/lib/services/hr-compliance";
import { getCompanyId } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

// SIF Generation Action
export async function createWpsSif(month: number, year: number, employerId: string, bankRoutingCode: string) {
    try {
        const companyId = await getCompanyId();
        
        // 1. Fetch Active Employees for the Company
        // In a real scenario, we would join with Payroll Runs to get actual net pay.
        // For V120 Stub, we'll fetch employees and use their 'basicSalary' as a mock 'Net Pay' 
        // or assumes a payroll run was calculated.
        
        const activeEmployees = await db.query.employees.findMany({
            where: and(
                eq(employees.companyId, companyId), 
                eq(employees.status, "active") // Assuming status field
            ),
            // In a full implementation, we'd include relations to bank info here
        });

        if (activeEmployees.length === 0) {
           // Return stub data for demonstration if no DB data
           return {
               success: false,
               message: "No active employees found for SIF generation."
           };
        }

        // 2. Map to SIF Record Structure
        // We simulate the 'NetPay' as Basic + Allowances for now.
        const records = activeEmployees.map(emp => ({
            employee: {
                laborCardNo: emp.laborCardNumber || "00000000",
                routingCode: "0000", // Default agent
                bankIban: emp.iban || "AE000000000000000000000",
                bankAccountNo: emp.bankAccountNumber
            },
            basicSalary: Number(emp.basicSalary || 0),
            totalEarnings: Number(emp.basicSalary || 0) * 1.5, // Mock total
            netPay: Number(emp.basicSalary || 0) * 1.45 // Mock net
        }));

        // 3. Generate File Content
        const fileContent = generateWpsSif(employerId, bankRoutingCode, month, year, records);
        
        // 4. Return
        return {
            success: true,
            fileName: `SIF_${employerId}_${year}${month.toString().padStart(2, '0')}.sif`,
            content: fileContent
        };

    } catch (e: any) {
        return { success: false, message: e.message };
    }
}
