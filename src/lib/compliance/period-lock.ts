import { db } from "@/db";
import { periodLocks, users } from "@/db/schema";
import { eq, and, lte, gte } from "drizzle-orm";

/**
 * Compliance Engine: Period Locking
 * Prevents financial transactions in locked periods (e.g. Closed Fiscal Year).
 */

export async function checkPeriodLock(
  companyId: string, 
  transactionDate: Date, 
  module: "finance" | "inventory" | "sales" | "purchase"
): Promise<boolean> {
  // Check for any active lock that covers this date and module
  const lock = await db.query.periodLocks.findFirst({
    where: and(
      eq(periodLocks.companyId, companyId),
      lte(periodLocks.lockDate, transactionDate), // If lock date is AFTER transaction date? No, usually lock covers up to a date.
      // Actually standard logic: Lock Date = 31 Dec 2024.
      // Any transaction <= 31 Dec 2024 is LOCKED.
      // So if transactionDate <= lockDate, it throws.
    )
  });
  
  // Re-read query logic carefully:
  // We want to find *if there is a lock* that restricts this date.
  // Usually a lock says "Closed until X". 
  
  const activeLock = await db.query.periodLocks.findFirst({
    where: and(
      eq(periodLocks.companyId, companyId),
      gte(periodLocks.lockDate, transactionDate), // If Lock is 31 Dec, and Trans is 1 Jan... Wait.
      // Let's stick to standard accounting: "Books closed up to 31/12/2023"
      // So if Transaction Date <= Closed Date, then REJECT.
    )
  });
  
  // Let's do a direct query for simplicity and correctness
  const closedPeriod = await db.query.periodLocks.findFirst({
     where: and(
        eq(periodLocks.companyId, companyId),
        // If the lock date is greater than or equal to transaction date, it effectively means
        // this date is "in the past" relative to the lock? 
        // No, usually you define a "Period End Date" that is locked.
        // If transDate <= lockedPeriodEndDate, then ERROR.
     ),
     orderBy: (locks, { desc }) => [desc(locks.lockDate)]
  });

  if (closedPeriod && transactionDate <= closedPeriod.lockDate) {
     if (closedPeriod.isHardLock) return false; // Blocked
     // If soft lock, maybe allow with warning (but for API, we block)
     return false;
  }

  return true; // Allowed
}

export async function lockPeriod(
  companyId: string,
  lockDate: Date,
  reason: string,
  userId: string
) {
  // Create or update lock
  await db.insert(periodLocks).values({
    companyId,
    lockDate: lockDate,
    reason,
    isHardLock: true,
    lockedBy: userId
  });
}
