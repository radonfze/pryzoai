"use server";

import { db } from "@/db";
import { 
  payrollRuns, 
  payrollRunDetails, 
  employees, 
  numberSeries, 
  chartOfAccounts, 
  journalEntries, 
  journalLines 
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ActionResponse = { success: boolean; message: string; data?: any };

export type PayrollInput = {
    month: number; // 1-12
    year: number;
    paymentDate: string;
    notes?: string;
};

export async function processPayrollAction(input: PayrollInput): Promise<ActionResponse> {
    try {
        const DEMO_COMPANY_ID = "00000000-0000-0000-0000-000000000000";

        // 1. Check if run exists
        const existingRun = await db.query.payrollRuns.findFirst({
            where: and(
                eq(payrollRuns.companyId, DEMO_COMPANY_ID),
                eq(payrollRuns.month, input.month),
                eq(payrollRuns.year, input.year)
            )
        });

        if (existingRun) {
            return { success: false, message: `Payroll for ${input.month}/${input.year} already processed.` };
        }

        // 2. Fetch Active Employees
        const activeEmployees = await db.query.employees.findMany({
            where: and(
                eq(employees.companyId, DEMO_COMPANY_ID),
                eq(employees.status, "active")
            )
        });

        if (!activeEmployees.length) {
            return { success: false, message: "No active employees found." };
        }

        // 3. Generate Run Number
         const series = await db.query.numberSeries.findFirst({
            where: and(
                eq(numberSeries.companyId, DEMO_COMPANY_ID),
                eq(numberSeries.entityType, "payroll"), 
                eq(numberSeries.isActive, true)
            )
        });

        let runCode = `PAY-${input.year}-${input.month}`;
        if (series) {
            const nextVal = (series.currentValue || 0) + 1;
            runCode = `${series.prefix}-${nextVal.toString().padStart(5, '0')}`;
            await db.update(numberSeries).set({ currentValue: nextVal }).where(eq(numberSeries.id, series.id));
        }

        // 4. Calculate Totals & Create Transaction
        let totalEarnings = 0;
        let totalDeductions = 0;
        let totalNetPay = 0;

        const result = await db.transaction(async (tx) => {
            const [run] = await tx.insert(payrollRuns).values({
                companyId: DEMO_COMPANY_ID,
                runNumber: runCode,
                month: input.month,
                year: input.year,
                startDate: new Date(input.year, input.month - 1, 1),
                endDate: new Date(input.year, input.month, 0),
                paymentDate: new Date(input.paymentDate),
                status: "approved",
                totalEarnings: "0", // update later
                totalDeductions: "0",
                netPay: "0",
                isPosted: false
            }).returning();

            // Details
            const batchValues = activeEmployees.map(emp => {
                const basic = Number(emp.basicSalary || 0);
                // Simplified: No complex components yet
                const earning = basic; 
                const deduction = 0; 
                const net = earning - deduction;

                totalEarnings += earning;
                totalDeductions += deduction;
                totalNetPay += net;

                return {
                    companyId: DEMO_COMPANY_ID,
                    runId: run.id,
                    employeeId: emp.id,
                    basicSalary: basic.toString(),
                    totalEarnings: earning.toString(),
                    totalDeductions: deduction.toString(),
                    netPay: net.toString()
                };
            });

            if (batchValues.length > 0) {
                 await tx.insert(payrollRunDetails).values(batchValues);
            }
            
            // Update Run Totals
            await tx.update(payrollRuns).set({
                totalEarnings: totalEarnings.toString(),
                totalDeductions: totalDeductions.toString(),
                netPay: totalNetPay.toString()
            }).where(eq(payrollRuns.id, run.id));

            // 5. GL Posting
            // DR: Salaries Expense (5xxx)
            // CR: Bank/Cash (Asset) (Net Pay)
            // CR: Tax/Liabilities (Deductions) if any

             const coa = await tx.query.chartOfAccounts.findMany({
                where: and(eq(chartOfAccounts.companyId, DEMO_COMPANY_ID))
            });
            const getAccountId = (code: string) => coa.find(a => a.code === code)?.id;

            const salaryExpenseId = getAccountId("5200") || getAccountId("5100"); // Payroll Expense
            const bankId = getAccountId("1120"); // Bank

            if (salaryExpenseId && bankId) {
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
                    sourceDocType: "PAYROLL",
                    sourceDocId: run.id,
                    sourceDocNumber: runCode,
                    description: `Payroll Run ${input.month}/${input.year}`,
                    totalDebit: totalEarnings.toFixed(2),
                    totalCredit: totalEarnings.toFixed(2), // Simplification assuming Earnings = Net (0 ded)
                    status: "posted"
                }).returning();

                // 1. Debit Expense
                await tx.insert(journalLines).values({
                    companyId: DEMO_COMPANY_ID,
                    journalId: journal.id,
                    lineNumber: 1,
                    accountId: salaryExpenseId,
                    description: `Salary Expense ${input.month}/${input.year}`,
                    debit: totalEarnings.toFixed(2),
                    credit: "0"
                });

                // 2. Credit Bank
                await tx.insert(journalLines).values({
                    companyId: DEMO_COMPANY_ID,
                    journalId: journal.id,
                    lineNumber: 2,
                    accountId: bankId,
                    description: `Salary Payment`,
                    debit: "0",
                    credit: totalNetPay.toFixed(2)
                });
                
                // If deductions existed, credit liabilities here
                
                await tx.update(payrollRuns).set({ isPosted: true }).where(eq(payrollRuns.id, run.id));
            }

            return { run };
        });

        revalidatePath("/hr/payroll");
        return { success: true, message: `Payroll ${runCode} processed successfully`, data: { id: result.run.id } };

    } catch (error: any) {
        console.error("Process Payroll Error:", error);
        return { success: false, message: error.message };
    }
}
