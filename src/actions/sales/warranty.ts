"use server";

import { db } from "@/db";
import { warrantyClaims } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { getCompanyId } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function createWarrantyClaim(data: any) {
    try {
        const companyId = await getCompanyId();
        await db.insert(warrantyClaims).values({
            companyId,
            claimNumber: data.claimNumber, // Should auto-gen in real app
            customerId: data.customerId,
            itemId: data.itemId,
            issueDescription: data.issueDescription,
            serialNumber: data.serialNumber,
            status: "received"
        });
        
        revalidatePath("/sales/warranty");
        return { success: true, message: "Claim created" };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

export async function getWarrantyClaims() {
    const companyId = await getCompanyId();
    return db.query.warrantyClaims.findMany({
        where: eq(warrantyClaims.companyId, companyId),
        with: { customer: true, item: true }
    });
}

export async function getWarrantyClaim(id: string) {
    const companyId = await getCompanyId();
    return db.query.warrantyClaims.findFirst({
        where: and(eq(warrantyClaims.id, id), eq(warrantyClaims.companyId, companyId)),
        with: { customer: true, item: true }
    });
}
