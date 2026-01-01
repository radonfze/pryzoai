"use server";

import { db } from "@/db";
import { items } from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCompanyId } from "@/lib/auth";

// Get next sequential item code
export async function getNextItemCode(): Promise<string> {
  const companyId = await getCompanyId();
  if (!companyId) return "1000";
  
  try {
    // Get the highest numeric code
    const result = await db.select({ code: items.code })
      .from(items)
      .where(eq(items.companyId, companyId))
      .orderBy(desc(items.code))
      .limit(1);
    
    if (result.length === 0) {
      return "1000"; // Start from 1000
    }
    
    const lastCode = result[0].code;
    const numericCode = parseInt(lastCode, 10);
    
    if (isNaN(numericCode)) {
      // If the last code isn't numeric, count total items and add 1000
      const countResult = await db.select({ count: sql<number>`count(*)` })
        .from(items)
        .where(eq(items.companyId, companyId));
      return String(1000 + (countResult[0]?.count || 0) + 1);
    }
    
    return String(numericCode + 1);
  } catch (error) {
    console.error("getNextItemCode error:", error);
    return "1000";
  }
}


export type ItemInput = {
    code: string;
    name: string;
    nameAr?: string;
    categoryId?: string;
    subCategoryId?: string;
    brandId?: string;
    modelId?: string;
    uom: string;
    alternativeUom?: string; // New
    conversionFactor?: number; // New
    
    // Pricing
    costPrice: number;
    sellingPrice: number;
    minSellingPrice: number;
    taxPercent: number;
    
    // Inventory
    reorderLevel: number;
    reorderQty: number;
    
    // Flags
    itemType: 'stock' | 'service' | 'goods'; // 'goods' maps to 'stock' in DB
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

        // Map 'goods' to 'stock' for DB enum
        const dbItemType = input.itemType === 'goods' ? 'stock' : input.itemType;

        const [newItem] = await db.insert(items).values({
            companyId,
            code: input.code,
            name: input.name,
            nameAr: input.nameAr,
            barcode: input.barcode,
            description: input.description,
            itemType: dbItemType as any,
            categoryId: input.categoryId || null,
            subCategoryId: input.subCategoryId || null,
            brandId: input.brandId || null,
            modelId: input.modelId || null,
            uom: input.uom,
            costPrice: input.costPrice.toString(),
            sellingPrice: input.sellingPrice.toString(),
            minSellingPrice: input.minSellingPrice.toString(),
            taxPercent: input.taxPercent.toString(),
            reorderLevel: input.reorderLevel.toString(),
            reorderQty: input.reorderQty.toString(),
            isActive: input.isActive,
            hasBatchNo: input.hasBatchNo,
            hasSerialNo: input.hasSerialNo,
            hasExpiry: input.hasExpiry,
        }).returning();

        // TODO: specific handling for opening stock if > 0 (Create Adjustment/Receipt automatically?)
        // For now, assume user will post Opening Stock separately or we add logic later.
        
        if (input.alternativeUom && input.alternativeUom !== '__NONE__' && input.alternativeUom !== input.uom) {
             // Import itemUnits dynamically if needed, or assume top-level import
             const { itemUnits } = await import("@/db/schema/items");
             await db.insert(itemUnits).values({
                 itemId: newItem.id,
                 uom: input.alternativeUom,
                 conversionFactor: input.conversionFactor?.toString() || "1",
                 isDefault: false
             });
        }

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
