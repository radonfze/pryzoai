import { db } from "@/db";
import { salesInvoices, purchaseInvoices, journalLines, chartOfAccounts } from "@/db/schema";
import { eq, sql, and, sum } from "drizzle-orm";

export interface FinanceStats {
  cashOnHand: number;
  receivables: number;
  payables: number;
  revenueYTD: number;
  expensesYTD: number;
}

const DEMO_COMPANY_ID = "00000000-0000-0000-0000-000000000000";

export async function getFinanceStats(companyId: string): Promise<FinanceStats> {
  // 1. Receivables (Simplified: Sum of pending invoices)
  const arResult = await db
    .select({ total: sum(salesInvoices.balanceAmount) })
    .from(salesInvoices)
    .where(and(eq(salesInvoices.companyId, companyId), eq(salesInvoices.status, "posted")));

  // 2. Payables (Sum of pending bills)
  const apResult = await db
    .select({ total: sum(purchaseInvoices.balanceAmount) })
    .from(purchaseInvoices)
    .where(and(eq(purchaseInvoices.companyId, companyId), eq(purchaseInvoices.status, "posted")));

  // 3. Cash on Hand (Sum of 'Asset' accounts with type 'cash'/'bank') -- Simplified to hardcoded query for MVP
  // Ideally query ledger balance for specific accounts.
  
  // 4. Revenue & Expenses (Sum of GL entries for Rev/Exp type accounts)
  // Simplified MVP:
  const revenueResult = await db
    .select({ total: sum(salesInvoices.totalAmount) }) // Using invoice total as proxy for now
    .from(salesInvoices)
    .where(and(eq(salesInvoices.companyId, companyId), eq(salesInvoices.status, "posted")));

  const expenseResult = await db
    .select({ total: sum(purchaseInvoices.totalAmount) })
    .from(purchaseInvoices)
    .where(and(eq(purchaseInvoices.companyId, companyId), eq(purchaseInvoices.status, "posted")));

  return {
    cashOnHand: 50000, // Mock current balance
    receivables: Number(arResult[0]?.total || 0),
    payables: Number(apResult[0]?.total || 0),
    revenueYTD: Number(revenueResult[0]?.total || 0),
    expensesYTD: Number(expenseResult[0]?.total || 0),
  };
}
