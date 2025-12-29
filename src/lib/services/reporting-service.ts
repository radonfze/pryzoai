import { db } from "@/db";
import { chartOfAccounts } from "@/db/schema/coa";
import { salesOrders, salesLines } from "@/db/schema/sales";
import { customers } from "@/db/schema/customers";
import { items } from "@/db/schema/items";
import { eq, and, sql, desc, gte, lte } from "drizzle-orm";

export type DateRange = {
  startDate: Date;
  endDate: Date;
};

export class ReportingService {
  
  static async getProfitAndLoss(companyId: string, range?: DateRange) {
    const revenueAccounts = await db.query.chartOfAccounts.findMany({
      where: and(
        eq(chartOfAccounts.companyId, companyId),
        eq(chartOfAccounts.accountType, "revenue")
      )
    });

    const expenseAccounts = await db.query.chartOfAccounts.findMany({
      where: and(
        eq(chartOfAccounts.companyId, companyId),
        eq(chartOfAccounts.accountType, "expense")
      )
    });

    const totalRevenue = revenueAccounts.reduce((sum, acc) => sum + Number(acc.currentBalance), 0);
    const totalExpense = expenseAccounts.reduce((sum, acc) => sum + Number(acc.currentBalance), 0);
    const netProfit = totalRevenue - totalExpense;

    return {
      revenue: {
        total: totalRevenue,
        accounts: revenueAccounts.map(a => ({ name: a.name, value: Number(a.currentBalance) }))
      },
      expense: {
        total: totalExpense,
        accounts: expenseAccounts.map(a => ({ name: a.name, value: Number(a.currentBalance) }))
      },
      netProfit
    };
  }

  static async getSalesAnalysis(companyId: string, range?: DateRange) {
    // Total Sales (Issued Orders)
    const salesData = await db
      .select({
        total: sql<number>`sum(${salesOrders.totalAmount})`,
        count: sql<number>`count(${salesOrders.id})`
      })
      .from(salesOrders)
      .where(and(
        eq(salesOrders.companyId, companyId),
        eq(salesOrders.status, "issued")
      ));

    // Top 5 Customers
    const topCustomers = await db
        .select({
            name: customers.name,
            value: sql<number>`sum(${salesOrders.totalAmount})`
        })
        .from(salesOrders)
        .leftJoin(customers, eq(salesOrders.customerId, customers.id))
        .where(and(
            eq(salesOrders.companyId, companyId),
            eq(salesOrders.status, "issued")
        ))
        .groupBy(customers.name)
        .orderBy(desc(sql`sum(${salesOrders.totalAmount})`))
        .limit(5);

    return {
        summary: salesData[0],
        topCustomers
    };
  }
}
