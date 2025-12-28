"use server";

import { db } from "@/db";
import { approvalRules } from "@/db/schema/approvals";
import { revalidatePath } from "next/cache";
import { getCompanyId } from "@/lib/auth";

export async function createApprovalRule(data: any) {
  try {
    const companyId = await getCompanyId();
    
    await db.insert(approvalRules).values({
      ...data,
      companyId,
      minAmount: data.minAmount || null,
      maxAmount: data.maxAmount || null,
    });

    revalidatePath("/settings/approvals");
    return { success: true };
  } catch (error) {
    console.error("Error creating approval rule:", error);
    return { success: false, error: "Failed to create rule" };
  }
}
