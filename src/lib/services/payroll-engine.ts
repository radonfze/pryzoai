"use server";

import { db } from "@/db";
import { payrollRuns, payrollDetails, employees } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCompanyId } from "@/lib/auth";

export async function processPayrollRun(month: number, year: number): Promise<{ success: boolean; runId?: string; message: string }> {
    try {
        const companyId = await getCompanyId();

        // 1. Check if run exists
        const existing = await db.query.payrollRuns.findFirst({
            where: and(
                eq(payrollRuns.companyId, companyId),
                eq(payrollRuns.periodMonth, month),
                eq(payrollRuns.periodYear, year)
            )
        });

        if (existing) {
             return { success: false, message: "Payroll for this period already exists." };
        }

        // 2. Fetch Active Employees with Salary Info
        const activeEmployees = await db.query.employees.findMany({
            where: and(eq(employees.companyId, companyId), eq(employees.status, "active"))
        });

        if (!activeEmployees.length) {
             return { success: false, message: "No active employees found to process." };
        }

        // 3. Create Payroll Run Header
        const runResult = await db.insert(payrollRuns).values({
            companyId,
            runNumber: `PR-${year}-${month.toString().padStart(2, '0')}`,
            periodMonth: month,
            periodYear: year,
            runDate: new Date().toISOString(),
            status: "draft",
            totalEmployees: activeEmployees.length
        }).returning();

        const runId = runResult[0].id;
        let totalNet = 0;

        // 4. Calculate Pay for Each Employee
        // (Simplified: Gross = Basic + Allowances. Deductions = 0 for now. Real engine would fetch attendance)
        const detailsData = activeEmployees.map(emp => {
            const basic = Number(emp.basicSalary || 0);
            const housing = Number(emp.housingAllowance || 0);
            const transport = Number(emp.transportAllowance || 0);
            const other = Number(emp.otherAllowance || 0);
            
            const gross = basic + housing + transport + other;
            const deductions = 0; // TODO: Integrate Leave/Loan deductions
            const net = gross - deductions;

            totalNet += net;

            return {
                companyId,
                payrollRunId: runId,
                employeeId: emp.id,
                basicSalary: basic.toFixed(2),
                housingAllowance: housing.toFixed(2),
                transportAllowance: transport.toFixed(2),
                otherAllowance: other.toFixed(2),
                totalEarnings: gross.toFixed(2),
                totalDeductions: deductions.toFixed(2),
                netPay: net.toFixed(2),
                paymentMethod: "wps"
            };
        });

        // 5. Bulk Insert Details
        if (detailsData.length > 0) {
            await db.insert(payrollDetails).values(detailsData);
        }

        // 6. Update Run Totals
        await db.update(payrollRuns).set({
            totalNetPay: totalNet.toFixed(2)
        }).where(eq(payrollRuns.id, runId));

        return { success: true, runId, message: "Payroll processed successfully." };

    } catch (error: any) {
        console.error("Payroll Process Error:", error);
        return { success: false, message: error.message };
    }
}
