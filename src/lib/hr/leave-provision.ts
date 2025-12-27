import { db } from "@/db";
import { 
  employees, 
  employeeLeaveBalance 
} from "@/db/schema"; // Assuming schema exists or using placeholders
import { eq, sql } from "drizzle-orm";

/**
 * Leave Provision Logic
 * Calculates and posts monthly accrual for EOSB (End of Service Benefit) and Leave Salary.
 */

// Constants for UAE Labor Law (Simplified)
const EOSB_DAYS_PER_YEAR = 21; // First 5 years
const LEAVE_DAYS_PER_YEAR = 30; 

export async function runLeaveProvision(
  companyId: string,
  periodYear: number,
  periodMonth: number
) {
  // 1. Get Active Employees
  const activeEmployees = await db.query.employees.findMany({
    where: and(eq(employees.companyId, companyId), eq(employees.status, "active"))
  });

  const provisions = [];

  for (const emp of activeEmployees) {
      // Calculate daily basic
      const basicSalary = Number(emp.basicSalary || 0);
      const dailyBasic = basicSalary / 30;

      // EOSB Accrual (21 days / 12 months = 1.75 days per month)
      const eosbDays = EOSB_DAYS_PER_YEAR / 12;
      const eosbAmount = dailyBasic * eosbDays;

      // Leave Accrual (2.5 days per month)
      const leaveDays = LEAVE_DAYS_PER_YEAR / 12;
      const leaveAmount = (Number(emp.basicSalary) + Number(emp.allowances || 0)) / 30 * leaveDays;

      provisions.push({
          employeeId: emp.id,
          period: `${periodYear}-${periodMonth}`,
          eosbAmount,
          leaveAmount
      });
  }

  // 2. Post to GL (Aggregate)
  const totalEosb = provisions.reduce((sum, p) => sum + p.eosbAmount, 0);
  const totalLeave = provisions.reduce((sum, p) => sum + p.leaveAmount, 0);

  // Dr EOSB Expense / Cr EOSB Provision
  // Dr Leave Expense / Cr Leave Provision
  
  return {
      processed: activeEmployees.length,
      totalEosb,
      totalLeave
  };
}
