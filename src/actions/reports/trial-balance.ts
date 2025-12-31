"use server";

import { db } from "@/db";
import { chartOfAccounts, journalLines, journalEntries } from "@/db/schema";
import { eq, and, sum, desc } from "drizzle-orm";
import { getCompanyId } from "@/lib/auth";

export async function getTrialBalance() {
  const companyId = await getCompanyId();
  if (!companyId) return [];

  // 1. Fetch all accounts
  const accounts = await db.query.chartOfAccounts.findMany({
    where: eq(chartOfAccounts.companyId, companyId),
    orderBy: [chartOfAccounts.code]
  });

  // 2. Fetch Aggregated Balances from Posted Journals
  const balances = await db
    .select({
      accountId: journalLines.accountId,
      totalDebit: sum(journalLines.debit),
      totalCredit: sum(journalLines.credit),
    })
    .from(journalLines)
    .innerJoin(journalEntries, eq(journalLines.journalId, journalEntries.id))
    .where(and(
        eq(journalEntries.companyId, companyId),
        eq(journalEntries.status, 'posted')
    ))
    .groupBy(journalLines.accountId);

  // 3. Map Balances to Accounts
  const balanceMap = new Map();
  balances.forEach(b => {
      balanceMap.set(b.accountId, {
          debit: Number(b.totalDebit || 0),
          credit: Number(b.totalCredit || 0)
      });
  });

  // 4. Transform for Report
  const reportData = accounts.map(acc => {
      const bal = balanceMap.get(acc.id) || { debit: 0, credit: 0 };
      const net = bal.debit - bal.credit;
      
      // Filter out zero balance accounts? Maybe kept for completeness, but flagged
      return {
          id: acc.id,
          code: acc.code,
          name: acc.name,
          type: acc.accountType,
          group: acc.accountGroup,
          debit: bal.debit,
          credit: bal.credit,
          netBalance: net
      };
  });

  // Filter out accounts with 0 movement? 
  // Trial Balance usually shows all with >0 balance.
  return reportData.filter(d => d.debit !== 0 || d.credit !== 0);
}
