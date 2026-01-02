"use server";

import { toTitleCase } from "@/lib/utils";


import { itemCategories, itemSubcategories } from "@/db/schema/item-hierarchy";
import { db } from "@/db";
import { revalidatePath } from "next/cache";
import { getCompanyId } from "@/lib/auth";
import { eq, desc, sql, inArray } from "drizzle-orm";
import { z } from "zod";

// Get next sequential subcategory code
export async function getNextSubcategoryCode(): Promise<string> {
  const companyId = await getCompanyId();
  if (!companyId) return "SUB1";
  try {
    const countResult = await db.select({ count: sql<number>`count(*)` })
      .from(itemSubcategories).where(eq(itemSubcategories.companyId, companyId));
    return `SUB${Number(countResult[0]?.count || 0) + 1}`;
  } catch { return "SUB1"; }
}


const subcategorySchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  // categoryId: z.string().min(1, "Category is required"), // Deprecated
  categoryIds: z.array(z.string()).min(1, "At least one Category is required"), // New
  nameAr: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export async function getSubcategories() {
  const companyId = await getCompanyId();
  if (!companyId) return [];

  const rawData = await db.query.itemSubcategories.findMany({
    where: eq(itemSubcategories.companyId, companyId),
    with: {
       categoryMappings: {
           with: {
               category: true
           }
       },
       // Keep getting standard category relation for fallback backward compatibility 
       category: true,
    },
    orderBy: [desc(itemSubcategories.createdAt)],
  });

  // Flatten for UI
  return rawData.map(sub => ({
      ...sub,
      // Create a flat array of Category IDs
      categoryIds: sub.categoryMappings?.map(m => m.categoryId) || (sub.categoryId ? [sub.categoryId] : [])
  }));
}

export async function getSubcategory(id: string) {
  const companyId = await getCompanyId();
  if (!companyId) return null;

  return await db.query.itemSubcategories.findFirst({
    where: eq(itemSubcategories.id, id),
    with: {
        categoryMappings: true
    }
  });
}

export async function createSubcategory(data: z.infer<typeof subcategorySchema>) {
  const companyId = await getCompanyId();
  if (!companyId) throw new Error("Unauthorized");

  const validation = subcategorySchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.flatten().fieldErrors };
  }

  const { categoryIds, ...subData } = validation.data;

  try {
    const [newSub] = await db.insert(itemSubcategories).values({
      companyId,
      ...subData,
      categoryId: categoryIds[0], // Set Primary Category for backward compat
      name: toTitleCase(subData.name),
    }).returning();

    // Insert Mappings
    if (categoryIds.length > 0) {
        const { subcategoryCategories } = await import("@/db/schema/item-hierarchy");
        await db.insert(subcategoryCategories).values(
            categoryIds.map(catId => ({
                subcategoryId: newSub.id,
                categoryId: catId
            }))
        );
    }

    revalidatePath("/inventory/subcategories");
    return { success: true, id: newSub.id };
  } catch (error: any) {
    console.error("Failed to create subcategory:", error);
    return { success: false, error: error.message };
  }
}

export async function updateSubcategory(id: string, data: z.infer<typeof subcategorySchema>) {
  const companyId = await getCompanyId();
  if (!companyId) throw new Error("Unauthorized");

  const validation = subcategorySchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.flatten().fieldErrors };
  }

  const { categoryIds, ...subData } = validation.data;

  try {
    await db.update(itemSubcategories)
      .set({
        ...subData,
        categoryId: categoryIds[0], // Update Primary
        name: toTitleCase(subData.name),
        updatedAt: new Date(),
      })
      .where(eq(itemSubcategories.id, id));

    // Update Mappings
    if (categoryIds) {
        const { subcategoryCategories } = await import("@/db/schema/item-hierarchy");
        
        // 1. Delete old
        await db.delete(subcategoryCategories).where(eq(subcategoryCategories.subcategoryId, id));

        // 2. Insert new
        if (categoryIds.length > 0) {
             await db.insert(subcategoryCategories).values(
                categoryIds.map(catId => ({
                    subcategoryId: id,
                    categoryId: catId
                }))
            );
        }
    }

    revalidatePath("/inventory/subcategories");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update subcategory:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteSubcategory(id: string) {
  const companyId = await getCompanyId();
  if (!companyId) throw new Error("Unauthorized");

  try {
    const { subcategoryCategories } = await import("@/db/schema/item-hierarchy");
    // Delete mappings first
    await db.delete(subcategoryCategories).where(eq(subcategoryCategories.subcategoryId, id));

    await db.delete(itemSubcategories).where(eq(itemSubcategories.id, id));
    revalidatePath("/inventory/subcategories");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete subcategory:", error);
    return { success: false, error: "Cannot delete subcategory in use" };
  }
}

export async function deleteSubcategories(ids: string[]) {
  const companyId = await getCompanyId();
  if (!companyId) throw new Error("Unauthorized");

  try {
    const { subcategoryCategories } = await import("@/db/schema/item-hierarchy");
    // Delete mappings first
    await db.delete(subcategoryCategories).where(inArray(subcategoryCategories.subcategoryId, ids));

    await db.delete(itemSubcategories).where(inArray(itemSubcategories.id, ids));
    revalidatePath("/inventory/subcategories");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete subcategories:", error);
    return { success: false, error: "Cannot delete selected subcategories" };
  }
}
