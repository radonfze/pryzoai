"use server";

import { db } from "@/db";
import { itemBrands } from "@/db/schema/item-hierarchy";
import { revalidatePath } from "next/cache";
import { getCompanyId } from "@/lib/auth";
import { eq, desc, sql } from "drizzle-orm";
import { z } from "zod";

// Get next sequential brand code
export async function getNextBrandCode(): Promise<string> {
  const companyId = await getCompanyId();
  if (!companyId) return "BRD1";
  try {
    const countResult = await db.select({ count: sql<number>`count(*)` })
      .from(itemBrands).where(eq(itemBrands.companyId, companyId));
    return `BRD${Number(countResult[0]?.count || 0) + 1}`;
  } catch { return "BRD1"; }
}


const brandSchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  nameAr: z.string().optional(),
  website: z.string().optional(),
  isActive: z.boolean().default(true),
  categoryIds: z.array(z.string()).optional(), // New field
});

export async function getBrands() {
  const companyId = await getCompanyId();
  if (!companyId) return [];

  return db.query.itemBrands.findMany({
    where: eq(itemBrands.companyId, companyId),
    orderBy: [desc(itemBrands.createdAt)],
  });
}

export async function getBrand(id: string) {
  const companyId = await getCompanyId();
  if (!companyId) return null;

  return db.query.itemBrands.findFirst({
    where: eq(itemBrands.id, id),
  });
}

export async function createBrand(data: z.infer<typeof brandSchema>) {
  const companyId = await getCompanyId();
  if (!companyId) throw new Error("Unauthorized");

  const validation = brandSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.flatten().fieldErrors };
  }

  const { categoryIds, ...brandData } = validation.data;

  try {
    const [newItem] = await db.insert(itemBrands).values({
      companyId,
      ...brandData,
    }).returning();

    // Link Categories
    if (categoryIds && categoryIds.length > 0) {
       // Import brandCategories dynamically or top-level if possible.
       // Assuming import is handled at top level.
       const { brandCategories } = await import("@/db/schema/item-hierarchy");
       
       await db.insert(brandCategories).values(
         categoryIds.map((catId) => ({
           brandId: newItem.id,
           categoryId: catId
         }))
       );
    }

    revalidatePath("/inventory/brands");
    return { success: true, id: newItem.id };
  } catch (error: any) {
    console.error("Failed to create brand:", error);
    return { success: false, error: error.message };
  }
}

export async function updateBrand(id: string, data: z.infer<typeof brandSchema>) {
  const companyId = await getCompanyId();
  if (!companyId) throw new Error("Unauthorized");

  const validation = brandSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.flatten().fieldErrors };
  }

  const { categoryIds, ...brandData } = validation.data;

  try {
    await db.update(itemBrands)
      .set({
        ...brandData,
        updatedAt: new Date(),
      })
      .where(eq(itemBrands.id, id));
    
    // Manage Categories
    if (categoryIds !== undefined) {
         const { brandCategories } = await import("@/db/schema/item-hierarchy");
         
         // 1. Delete existing
         await db.delete(brandCategories).where(eq(brandCategories.brandId, id));

         // 2. Insert new
         if (categoryIds.length > 0) {
            await db.insert(brandCategories).values(
                categoryIds.map((catId) => ({
                brandId: id,
                categoryId: catId
                }))
            );
         }
    }

    revalidatePath("/inventory/brands");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update brand:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteBrand(id: string) {
  const companyId = await getCompanyId();
  if (!companyId) throw new Error("Unauthorized");

  try {
    // Delete mappings first (CASCADE might handle this, but safe to be explicit if no Cascade)
    const { brandCategories } = await import("@/db/schema/item-hierarchy");
    await db.delete(brandCategories).where(eq(brandCategories.brandId, id));
    
    await db.delete(itemBrands).where(eq(itemBrands.id, id));
    revalidatePath("/inventory/brands");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete brand:", error);
    return { success: false, error: "Cannot delete brand in use" };
  }
}
