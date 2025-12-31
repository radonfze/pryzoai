"use server";

import { db } from "@/db";
import { fiscalPeriods } from "@/db/schema";
import { eq, and, asc, desc } from "drizzle-orm";
import { getCompanyId, requirePermission } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { addMonths, startOfMonth, endOfMonth, format } from "date-fns";

export async function getFiscalPeriods() {
  const companyId = await getCompanyId();
  if (!companyId) return [];

  return await db.query.fiscalPeriods.findMany({
    where: eq(fiscalPeriods.companyId, companyId),
    orderBy: [desc(fiscalPeriods.startDate)]
  });
}

export async function createFiscalYear(year: number) {
  try {
    const companyId = await getCompanyId();
    await requirePermission("settings.company.edit"); // Re-using permission

    // Check if any period already exists for this year
    const existing = await db.query.fiscalPeriods.findFirst({
        where: and(
            eq(fiscalPeriods.companyId, companyId),
            eq(fiscalPeriods.fiscalYear, year)
        )
    });

    if (existing) {
        return { success: false, message: `Fiscal Year ${year} already exists.` };
    }

    // Generate 12 months
    const periods = [];
    let currentDate = new Date(year, 0, 1); // Jan 1st

    for (let i = 1; i <= 12; i++) {
        periods.push({
            companyId,
            periodName: format(currentDate, "MMM yyyy"),
            startDate: format(startOfMonth(currentDate), "yyyy-MM-dd"), // Correct format YYYY-MM-DD
            endDate: format(endOfMonth(currentDate), "yyyy-MM-dd"),
            fiscalYear: year,
            periodNumber: i,
            status: "open"
        });
        currentDate = addMonths(currentDate, 1);
    }

    await db.insert(fiscalPeriods).values(periods);
    
    revalidatePath("/settings/fiscal-years");
    return { success: true, message: `Fiscal Year ${year} created with 12 periods.` };

  } catch (e: any) {
      console.error(e);
      return { success: false, message: e.message };
  }
}

export async function togglePeriodStatus(periodId: string, newStatus: "open" | "closed") {
    try {
        const companyId = await getCompanyId();
        await requirePermission("settings.company.edit");

        await db.update(fiscalPeriods)
            .set({ status: newStatus })
            .where(and(
                eq(fiscalPeriods.id, periodId),
                eq(fiscalPeriods.companyId, companyId)
            ));

        revalidatePath("/settings/fiscal-years");
        return { success: true, message: "Status updated" };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}
