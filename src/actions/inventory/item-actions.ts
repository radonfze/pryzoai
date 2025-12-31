"use server";

import { db } from "@/db";
import { items } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCompanyId } from "@/lib/auth";

export type ItemInput = {
    code: string;
    name: string;
    nameAr?: string;
    categoryId?: string;
    subCategoryId?: string; // Optional if schema supports
    brandId?: string;
    modelId?: string;
    uom: string;
    
    // Pricing
    costPrice: number;
    sellingPrice: number;
    minSellingPrice: number;
    taxPercent: number;
    
    // Inventory
    openingStock?: number; // Might handle separately? For now just master data
    openingStockValue?: number;
    reorderLevel: number;
    reorderQty: number;
    
    // Flags
    itemType: 'goods' | 'service';
    isActive: boolean;
    hasBatchNo: boolean;
    hasSerialNo: boolean;
    hasExpiry: boolean;
    
    barcode?: string;
    description?: string;
};

export async function createItemAction(input: ItemInput) {
    const companyId = await getCompanyId();
    if (!companyId) return { success: false, message: "Unauthorized" };

    try {
        // Check uniqueness
        const existing = await db.query.items.findFirst({
            where: and(eq(items.companyId, companyId), eq(items.code, input.code))
        });
        if (existing) return { success: false, message: "Item code already exists" };

        const [newItem] = await db.insert(items).values({
            companyId,
            ...input,
            costPrice: input.costPrice.toString(),
            sellingPrice: input.sellingPrice.toString(),
            minSellingPrice: input.minSellingPrice.toString(),
            taxPercent: input.taxPercent.toString(),
            reorderLevel: input.reorderLevel.toString(),
            reorderQty: input.reorderQty.toString(),
            openingStock: (input.openingStock || 0).toString(),
            openingStockValue: (input.openingStockValue || 0).toString(),
        }).returning();

        // TODO: specific handling for opening stock if > 0 (Create Adjustment/Receipt automatically?)
        // For now, assume user will post Opening Stock separately or we add logic later.
        
        revalidatePath("/inventory/items");
        return { success: true, message: "Item created successfully", id: newItem.id };

    } catch (error: any) {
        console.error("Create Item Error:", error);
        return { success: false, message: error.message };
    }
}

export async function updateItemAction(id: string, input: ItemInput) {
    const companyId = await getCompanyId();
    if (!companyId) return { success: false, message: "Unauthorized" };

    try {
        await db.update(items).set({
            ...input,
             costPrice: input.costPrice.toString(),
            sellingPrice: input.sellingPrice.toString(),
            minSellingPrice: input.minSellingPrice.toString(),
            taxPercent: input.taxPercent.toString(),
            reorderLevel: input.reorderLevel.toString(),
            reorderQty: input.reorderQty.toString(),
            updatedAt: new Date()
        })
        .where(and(eq(items.id, id), eq(items.companyId, companyId)));

        revalidatePath("/inventory/items");
        revalidatePath(`/inventory/items/${id}`);
        return { success: true, message: "Item updated successfully" };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}
