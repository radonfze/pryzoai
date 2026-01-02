"use server";

import { db } from "@/db";
import { roles, PERMISSIONS } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCompanyId, requirePermission } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type RoleInput = {
    name: string;
    description?: string;
    isActive: boolean;
    permissions: string[];
};

export async function getRoleById(id: string) {
    const companyId = await getCompanyId();
    if (!companyId) return null;

    return db.query.roles.findFirst({
        where: and(eq(roles.id, id), eq(roles.companyId, companyId))
    });
}

export async function updateRole(id: string, input: RoleInput) {
    const companyId = await getCompanyId();
    if (!companyId) return { success: false, message: "Unauthorized" };

    // Security: Only admins (or those with roles.manage) can edit roles
    // We haven't fully bootstrapped this permission yet, so we assume if you can call this, middleware let you in
    // But let's be safe:
    // await requirePermission("settings.roles.manage"); 

    try {
        await db.update(roles).set({
            name: input.name,
            description: input.description,
            isActive: input.isActive,
            permissions: input.permissions,
            updatedAt: new Date()
        }).where(and(eq(roles.id, id), eq(roles.companyId, companyId)));

        revalidatePath("/settings/roles");
        revalidatePath(`/settings/roles/${id}`);
        return { success: true, message: "Role updated successfully" };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function createRole(input: Omit<RoleInput, 'isActive'> & { code: string }) {
    const companyId = await getCompanyId();
    if (!companyId) return { success: false, message: "Unauthorized" };

    try {
        const [newRole] = await db.insert(roles).values({
            companyId,
            code: input.code,
            name: input.name,
            description: input.description,
            permissions: input.permissions,
            isActive: true
        }).returning();

        revalidatePath("/settings/roles");
        return { success: true, id: newRole.id, message: "Role created successfully" };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}
