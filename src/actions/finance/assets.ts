"use server";

import { db } from "@/db";
import { fixedAssets } from "@/db/schema/fixed-assets";
import { revalidatePath } from "next/cache";
import { getCompanyId } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function createAsset(data: any) {
    try {
        const companyId = await getCompanyId();
        // Validation skipped for brevity
        await db.insert(fixedAssets).values({
            companyId,
            ...data,
            categoryId: data.categoryId, // Must allow UI to pick
            status: "active"
        });
        
        revalidatePath("/finance/assets");
        return { success: true, message: "Asset created" };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function getAssets() {
    const companyId = await getCompanyId();
    return db.query.fixedAssets.findMany({
        where: eq(fixedAssets.companyId, companyId),
        with: { category: true }
    });
}
