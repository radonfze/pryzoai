"use server";

import { db } from "@/db";
import { salesTeams, salesTeamMembers, salesTargets } from "@/db/schema/sales-teams";
import { users } from "@/db/schema/users";
import { revalidatePath } from "next/cache";
import { getCompanyId } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";

// --- Types ---
export type SalesTeamInput = {
  name: string;
  description?: string;
  managerId?: string;
};

// --- Actions ---

export async function createSalesTeam(data: SalesTeamInput) {
  try {
    const companyId = await getCompanyId();
    
    // 1. Create Team
    const [newTeam] = await db.insert(salesTeams).values({
      companyId,
      name: data.name,
      description: data.description,
      managerId: data.managerId,
      isActive: true,
    }).returning();

    // 2. If manager is selected, add them as a 'lead' member automatically
    if (data.managerId) {
       await db.insert(salesTeamMembers).values({
         companyId,
         teamId: newTeam.id,
         userId: data.managerId,
         role: "lead",
         joinedAt: new Date().toISOString()
       });
    }

    revalidatePath("/sales/teams");
    return { success: true, teamId: newTeam.id };
  } catch (error: any) {
    console.error("Create Team Error:", error);
    return { success: false, error: error.message };
  }
}

export async function getSalesTeams() {
  const companyId = await getCompanyId();
  return db.query.salesTeams.findMany({
    where: eq(salesTeams.companyId, companyId),
    with: {
      manager: true,
      members: {
        with: { user: true }
      }
    }
  });
}

export async function getSalesUsers() {
    // Helper to get users for dropdowns
    const companyId = await getCompanyId();
    // Assuming we want all active users for now
    return db.query.users.findMany({
        where: eq(users.isActive, true)
    });
}
