"use server";

import { db } from "@/db";
import { chartOfAccounts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ActionResponse = {
  success: boolean;
  message: string;
  data?: any;
};

export type AccountInput = {
  code: string;
  name: string;
  type: "asset" | "liability" | "equity" | "revenue" | "expense";
  group: string; // e.g., cash_bank, fixed_assets
  parentId?: string; // Optional parent account ID
  isGroup?: boolean; // Not in schema but logic helper? Schema uses parentId to imply hierarchy. 
  // Actually, standard practice: if it has children, it's a group. But we might want explicit flag if UI needs it.
  // For now, we just insert as regular account.
};

export async function createAccountAction(input: AccountInput): Promise<ActionResponse> {
  try {
    const DEMO_COMPANY_ID = "00000000-0000-0000-0000-000000000000";

    // 1. Validation
    if (!input.code || !input.name || !input.type || !input.group) {
      return { success: false, message: "Code, Name, Type, and Group are required." };
    }

    // Check duplicate code
    const existing = await db.query.chartOfAccounts.findFirst({
      where: and(
        eq(chartOfAccounts.companyId, DEMO_COMPANY_ID),
        eq(chartOfAccounts.code, input.code)
      )
    });

    if (existing) {
      return { success: false, message: `Account code ${input.code} already exists.` };
    }

    // 2. Insert
    const [newAccount] = await db.insert(chartOfAccounts).values({
      companyId: DEMO_COMPANY_ID,
      code: input.code,
      name: input.name,
      accountType: input.type,
      accountGroup: input.group as any,
      parentId: input.parentId || null,
      isActive: true,
      // Default balances to 0
      openingBalance: "0",
      currentBalance: "0"
    }).returning();

    revalidatePath("/finance/coa");
    return { success: true, message: `Account ${input.name} created successfully`, data: newAccount };

  } catch (error: any) {
    console.error("Create Account Error:", error);
    return { success: false, message: error.message || "Failed to create account" };
  }
}
