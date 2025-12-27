import { db } from "@/db";
import { salesInvoices, customers, salesQuotations } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";

export interface SalesDashboardStats {
  totalRevenue: number;
  outstandingAmount: number;
  activeCustomers: number;
  pendingQuotations: number;
}

export async function getSalesStats(companyId: string): Promise<SalesDashboardStats> {
  // 1. Total Revenue (Total of 'posted' invoices)
  // using sum()
  const revenueResult = await db
    .select({ 
      total: sql<number>`sum(${salesInvoices.totalAmount})` 
    })
    .from(salesInvoices)
    .where(
      and(
        eq(salesInvoices.companyId, companyId),
        eq(salesInvoices.status, "posted") // or completed
      )
    );

  // 2. Outstanding Amount (Balance of 'posted' invoices)
  const outstandingResult = await db
    .select({
      balance: sql<number>`sum(${salesInvoices.balanceAmount})`
    })
    .from(salesInvoices)
    .where(
      and(
        eq(salesInvoices.companyId, companyId),
        eq(salesInvoices.status, "posted")
      )
    );

  // 3. Active Customers (Count)
  const customersResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(customers)
    .where(
      and(
        eq(customers.companyId, companyId),
        eq(customers.status, "active")
      )
    );

  // 4. Pending Quotations ('sent' or 'draft')
  const quotesResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(salesQuotations)
    .where(
      and(
        eq(salesQuotations.companyId, companyId),
        eq(salesQuotations.status, "sent")
      )
    );

  return {
    totalRevenue: Number(revenueResult[0]?.total || 0),
    outstandingAmount: Number(outstandingResult[0]?.balance || 0),
    activeCustomers: Number(customersResult[0]?.count || 0),
    pendingQuotations: Number(quotesResult[0]?.count || 0),
  };
}

export async function getRecentInvoices(companyId: string, limit = 5) {
  return await db.query.salesInvoices.findMany({
    where: eq(salesInvoices.companyId, companyId),
    with: {
      customer: true
    },
    orderBy: (invoices, { desc }) => [desc(invoices.createdAt)],
    limit: limit,
  });
}
