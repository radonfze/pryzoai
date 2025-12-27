import { db } from "@/db";
import { periodLocks } from "@/db/schema";
import { eq, and, lte, gte, desc } from "drizzle-orm";

/**
 * Compliance Engine: Period Locking
 * Prevents financial transactions in locked periods (e.g. Closed Fiscal Year).
 */

export async function checkPeriodLock(
  companyId: string, 
  transactionDate: Date, 
  module: "finance" | "inventory" | "sales" | "purchase"
): Promise<boolean> {
  // Schema uses: lockedAt, lockType ("soft" | "hard"), fiscalYear, periodMonth - NOT lockDate
  // For simplicity, check if there's any period lock for this company
  const closedPeriod = await db.query.periodLocks.findFirst({
     where: and(
        eq(periodLocks.companyId, companyId),
        eq(periodLocks.module, module),
     ),
     orderBy: [desc(periodLocks.lockedAt)]
  });

  if (!closedPeriod) return true; // No lock found, allowed
  
  // Check if transaction date falls within locked period
  const transYear = transactionDate.getFullYear();
  const transMonth = transactionDate.getMonth() + 1;
  
  if (transYear < closedPeriod.fiscalYear) return false; // Blocked
  if (transYear === closedPeriod.fiscalYear && transMonth <= closedPeriod.periodMonth) {
     if (closedPeriod.lockType === "hard") return false; // Hard locked
     // Soft lock - could allow with warning, but for safety we block
     return false;
  }

  return true; // Allowed
}

export async function lockPeriod(
  companyId: string,
  fiscalYear: number,
  periodMonth: number,
  module: string,
  userId: string
) {
  // Create lock using correct schema fields
  await db.insert(periodLocks).values({
    companyId,
    fiscalYear,
    periodMonth,
    module,
    lockType: "hard",
    lockedAt: new Date(),
    lockedBy: userId
  });
}
