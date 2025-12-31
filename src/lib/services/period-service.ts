import { db } from "@/db";
import { fiscalPeriods } from "@/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";

/**
 * Validate if a posting date falls within an open fiscal period
 * @param date The date to validate
 * @param companyId The company ID
 * @param tx Optional transaction context
 * @returns The fiscal period if valid
 * @throws Error if no period found or period is locked
 */
export async function validatePostingPeriod(
  date: Date, 
  companyId: string,
  tx?: any
) {
  const database = tx || db;
  
  // Find the fiscal period covering this date
  const period = await database.query.fiscalPeriods.findFirst({
    where: and(
      eq(fiscalPeriods.companyId, companyId),
      lte(fiscalPeriods.startDate, date), // startDate <= date
      gte(fiscalPeriods.endDate, date)    // endDate >= date
    ),
  });

  if (!period) {
    throw new Error(`No fiscal period defined for date: ${date.toISOString().split('T')[0]}`);
  }

  if (period.status !== "open") {
    throw new Error(`Fiscal period '${period.periodName}' is ${period.status} and cannot accept new postings.`);
  }

  return period;
}

/**
 * Check if a journal entry can be modified (must not be in a locked period)
 * useful for edits/deletions of Drafts if we enforce period locks on drafts too
 */
export async function canModifyPeriod(
    date: Date,
    companyId: string,
    tx?: any
): Promise<boolean> {
    try {
        await validatePostingPeriod(date, companyId, tx);
        return true;
    } catch (e) {
        return false;
    }
}
