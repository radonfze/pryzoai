"use server";

import { db } from "@/db";
import { payrollRuns, payrollDetails, employees, attendance, employeeLoans } from "@/db/schema";
import { eq, and, between, sum, sql } from "drizzle-orm";
import { getCompanyId } from "@/lib/auth";
import { startOfMonth, endOfMonth, format } from "date-fns";

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
        const startDate = startOfMonth(new Date(year, month - 1));
        const endDate = endOfMonth(new Date(year, month - 1));
        const formattedStart = format(startDate, 'yyyy-MM-dd');
        const formattedEnd = format(endDate, 'yyyy-MM-dd');

        // Fetch Attendance stats per employee for this month
        // Group by employeeId -> Sum OT hours, count Absences
        // Since Drizzle query builder grouping is tricky, we might loop or use raw sql. 
        // For distinct employees, let's just query inside the loop for MVP or fetch all and map.
        // Fetching all attendance logic:
        const attendanceRecords = await db.query.attendance.findMany({
            where: and(
                eq(attendance.companyId, companyId),
                between(attendance.attendanceDate, formattedStart, formattedEnd)
            )
        });

        // Fetch Active Loans
        const activeLoans = await db.query.employeeLoans.findMany({
            where: and(
                eq(employeeLoans.companyId, companyId),
                eq(employeeLoans.status, 'active')
            )
        });

        const detailsData = activeEmployees.map(emp => {
             // A. Earnings
            const basic = Number(emp.basicSalary || 0);
            const housing = Number(emp.housingAllowance || 0);
            const transport = Number(emp.transportAllowance || 0);
            const other = Number(emp.otherAllowance || 0);
            
            // B. Attendance Calculations
            const empAttendance = attendanceRecords.filter(a => a.employeeId === emp.id);
            
            // B1. Overtime
            const totalOTHours = empAttendance.reduce((acc, curr) => acc + Number(curr.overtimeHours || 0), 0);
            // Formula: (Basic / 240 hours) * 1.5 * OT Hours. Assuming 30 days * 8 hrs = 240.
            const hourlyRate = basic / 240; 
            const overtimePay = Number((hourlyRate * 1.5 * totalOTHours).toFixed(2));

            // B2. Absences (Unpaid)
            // Count 'absent' status days
            const absentDays = empAttendance.filter(a => a.status === 'absent').length;
            const dailyRate = (basic + housing + transport + other) / 30; // Gross / 30
            const absenceDeduction = Number((dailyRate * absentDays).toFixed(2));

            // C. Loans
            const empLoan = activeLoans.find(l => l.employeeId === emp.id);
            const loanDeduction = empLoan ? Number(empLoan.monthlyDeduction) : 0;

            const gross = basic + housing + transport + other + overtimePay;
            const totalDeductions = absenceDeduction + loanDeduction;
            const net = gross - totalDeductions;

            totalNet += net;

            return {
                companyId,
                payrollRunId: runId,
                employeeId: emp.id,
                basicSalary: basic.toFixed(2),
                housingAllowance: housing.toFixed(2),
                transportAllowance: transport.toFixed(2),
                otherAllowance: other.toFixed(2),
                overtime: overtimePay.toFixed(2), // NEW
                totalEarnings: gross.toFixed(2),
                absenceDeduction: absenceDeduction.toFixed(2), // NEW
                loanDeduction: loanDeduction.toFixed(2), // NEW
                totalDeductions: totalDeductions.toFixed(2),
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
