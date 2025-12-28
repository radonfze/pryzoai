
import { format } from "date-fns";

/**
 * Generates UAE WPS (Wages Protection System) SIF (Salary Information File) content.
 * Format: .sif (CSV-like but fixed width or specific header)
 * 
 * Standard SIF Structure (MOHRE):
 * Header: SCR, EmployerID, BankRoutingCode, FileCreationDate, VerifyTime, PayrollMonth, PayrollYear, TotalRecords, TotalAmount
 * Body: EDR, EmployeeID, AgentID, AccountNo, PayStartDate, PayEndDate, DaysInPeriod, FixedIncome, VariableIncome, Leaves, TotalSalary
 */

export function generateWpsSif(
    employerId: string,
    bankRoutingCode: string, 
    month: number, 
    year: number, 
    records: any[]
): string {
    const creationDate = format(new Date(), "yyyy-MM-dd");
    const creationTime = format(new Date(), "HHmm");
    const totalAmount = records.reduce((sum, r) => sum + Number(r.netPay), 0).toFixed(2);
    const totalRecords = records.length;

    // Header Record (SCR)
    // Example: SCR, 1234567890123, 1234, 2025-01-25, 1430, 01, 2025, 50, 150000.00, AED
    const header = `SCR,${employerId},${bankRoutingCode},${creationDate},${creationTime},${month.toString().padStart(2, '0')},${year},${totalRecords},${totalAmount},AED`;

    // Body Records (EDR)
    // EDR, PersonID(LabourCard), BankRoutingCode(Agent), AgentAccount(IBAN/Acc), StartDate, EndDate, Days, Fixed, Variable, Leave, Total
    const body = records.map(r => {
        // Validation checks implied
        const labourCard = r.employee?.laborCardNo || "000000";
        const agentRouting = r.employee?.routingCode || "0000";
        const account = r.employee?.bankIban || r.employee?.bankAccountNo || "00000000000000000000000";
        const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
        const endDate = format(new Date(year, month, 0), "yyyy-MM-dd"); // Last day of month
        const days = 30; // Standardize or calculate
        const fixed = Number(r.basicSalary).toFixed(2);
        const variable = (Number(r.totalEarnings) - Number(r.basicSalary)).toFixed(2);
        const total = Number(r.netPay).toFixed(2);

        return `EDR,${labourCard},${agentRouting},${account},${startDate},${endDate},${days},${fixed},${variable},0,${total}`;
    }).join("\n");

    return `${header}\n${body}`;
}

/**
 * Calculates End of Service Benefit (Gratuity) based on UAE Labour Law
 * @param basicSalary Last basic salary
 * @param yearsOfService Total service in years (decimal)
 * @param type "limited" | "unlimited" (Contracts <= 2023 were unlimited, now mostly limited)
 * @param terminationReason "resignation" | "termination"
 */
export function calculateEOSB(
    basicSalary: number,
    yearsOfService: number,
    terminationReason: "resignation" | "termination" = "termination"
): number {
    // New UAE Labour Law (2022 Decree): 
    // - 21 days basic per year for first 5 years
    // - 30 days basic per year for years > 5
    // - Resignation reduction rules largely removed for Limited contracts (which is default now)
    
    // Simplification for MVP:
    let gratuity = 0;

    if (yearsOfService < 1) return 0; // No gratuity if < 1 year

    const dayPay = basicSalary / 30;

    if (yearsOfService <= 5) {
        gratuity = yearsOfService * 21 * dayPay;
    } else {
        gratuity = (5 * 21 * dayPay) + ((yearsOfService - 5) * 30 * dayPay);
    }
    
    // Cap at 2 years total salary
    const cap = basicSalary * 24;
    return Math.min(gratuity, cap);
}
