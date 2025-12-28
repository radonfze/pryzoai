import { db } from "@/db";
import { salesInvoices, purchaseInvoices, journalLines, chartOfAccounts } from "@/db/schema";
import { eq, sql, and, sum, or, ne } from "drizzle-orm";

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
  // Using "issued" or "partial" status (not "posted" which doesn't exist)
  const arResult = await db
    .select({ total: sum(salesInvoices.balanceAmount) })
    .from(salesInvoices)
    .where(and(
      eq(salesInvoices.companyId, companyId), 
      or(eq(salesInvoices.status, "issued"), eq(salesInvoices.status, "partial"))
    ));

  // 2. Payables (Sum of pending bills)
  const apResult = await db
    .select({ total: sum(purchaseInvoices.balanceAmount) })
    .from(purchaseInvoices)
    .where(and(
      eq(purchaseInvoices.companyId, companyId), 
      or(eq(purchaseInvoices.status, "issued"), eq(purchaseInvoices.status, "partial"))
    ));

  // 3. Cash on Hand - Mock for MVP
  
  // 4. Revenue & Expenses (Sum of invoice totals as proxy)
  const revenueResult = await db
    .select({ total: sum(salesInvoices.totalAmount) })
    .from(salesInvoices)
    .where(and(
      eq(salesInvoices.companyId, companyId), 
      ne(salesInvoices.status, "draft"),
      ne(salesInvoices.status, "cancelled")
    ));

  const expenseResult = await db
    .select({ total: sum(purchaseInvoices.totalAmount) })
    .from(purchaseInvoices)
    .where(and(
      eq(purchaseInvoices.companyId, companyId), 
      ne(purchaseInvoices.status, "draft"),
      ne(purchaseInvoices.status, "cancelled")
    ));

  return {
    cashOnHand: 50000, // Mock current balance
    receivables: Number(arResult[0]?.total || 0),
    payables: Number(apResult[0]?.total || 0),
    revenueYTD: Number(revenueResult[0]?.total || 0),
    expensesYTD: Number(expenseResult[0]?.total || 0),
  };
}
