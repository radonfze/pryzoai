"use server";

import { db } from "@/db";
import { defaultGlAccounts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCompanyId } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateGlMapping(mappings: Record<string, string>) {
    try {
        const companyId = await getCompanyId();

        // Loop through keys and upsert
        for (const [key, accountId] of Object.entries(mappings)) {
            if (!accountId || accountId === "none") continue;

            const existing = await db.query.defaultGlAccounts.findFirst({
                where: and(eq(defaultGlAccounts.companyId, companyId), eq(defaultGlAccounts.mappingKey, key))
            });

            if (existing) {
                await db.update(defaultGlAccounts)
                    .set({ accountId, updatedAt: new Date() })
                    .where(eq(defaultGlAccounts.id, existing.id));
            } else {
                await db.insert(defaultGlAccounts).values({
                    companyId,
                    mappingKey: key,
                    accountId
                });
            }
        }

        revalidatePath("/settings/gl-mapping");
        return { success: true, message: "GL Defaults Updated" };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

export async function getGlMappings() {
    const companyId = await getCompanyId();
    return db.query.defaultGlAccounts.findMany({
        where: eq(defaultGlAccounts.companyId, companyId)
    });
}
