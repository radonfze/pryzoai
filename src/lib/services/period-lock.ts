import { db } from "@/db";
import { periodLocks } from "@/db/schema";
import { eq, and, lte, gte } from "drizzle-orm";

export async function checkPeriodLock(companyId: string, date: Date, module: string): Promise<{ isLocked: boolean; message?: string }> {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    // Check for hard lock on specific module or 'all'
    const locks = await db.query.periodLocks.findFirst({
        where: and(
            eq(periodLocks.companyId, companyId),
            eq(periodLocks.fiscalYear, year),
            eq(periodLocks.periodMonth, month),
            // module match or 'all'
        )
    });

    if (locks) {
        if (locks.module === 'all' || locks.module === module) {
            return { isLocked: true, message: `Period ${month}/${year} is locked for ${module}.` };
        }
    }

    return { isLocked: false };
}

export async function lockPeriod(companyId: string, userId: string, year: number, month: number, module: string = 'all') {
    await db.insert(periodLocks).values({
        companyId,
        lockedBy: userId,
        fiscalYear: year,
        periodMonth: month,
        module,
        lockType: "hard",
        lockedAt: new Date()
    });
    return { success: true };
}
