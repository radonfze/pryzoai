"use server";

import { db } from "@/db";
import { itemCategories } from "@/db/schema/item-hierarchy";
import { eq, desc, sql, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCompanyId } from "@/lib/auth";

// Get next sequential category code (CAT1, CAT2, CAT3...)
export async function getNextCategoryCode(): Promise<string> {
  const companyId = await getCompanyId();
  if (!companyId) return "CAT1";
  
  try {
    const countResult = await db.select({ count: sql<number>`count(*)` })
      .from(itemCategories)
      .where(eq(itemCategories.companyId, companyId));
    const count = Number(countResult[0]?.count || 0);
    return `CAT${count + 1}`;
  } catch (error) {
    console.error("getNextCategoryCode error:", error);
    return "CAT1";
  }
}


const categorySchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  nameAr: z.string().optional(),
  description: z.string().optional(),
  baseUomId: z.string().uuid("Invalid Base UOM").optional().nullable(),
  alternativeUomId: z.string().uuid("Invalid Alternative UOM").optional().nullable(),
  conversionFactor: z.coerce.number().positive("Must be > 0").optional().nullable(),
  isActive: z.boolean().default(true),
});


export async function getCategories() {
  const companyId = await getCompanyId();
  if (!companyId) return [];

  return await db.query.itemCategories.findMany({
    where: eq(itemCategories.companyId, companyId),
    with: {
        baseUom: true,
        alternativeUom: true,
    },
    orderBy: [desc(itemCategories.createdAt)],
  });
}

export async function getCategory(id: string) {
  const companyId = await getCompanyId();
  if (!companyId) return null;

  return await db.query.itemCategories.findFirst({
    where: eq(itemCategories.id, id),
  });
}

export async function createCategory(data: z.infer<typeof categorySchema>) {
  const companyId = await getCompanyId();
  if (!companyId) throw new Error("Unauthorized");

  const validation = categorySchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.flatten().fieldErrors };
  }

  try {
    const [newCategory] = await db.insert(itemCategories).values({
      companyId,
      ...validation.data,
    }).returning();

    revalidatePath("/inventory/categories");
    return { success: true, id: newCategory.id };
  } catch (error: any) {
    console.error("Failed to create category:", error);
    return { success: false, error: error.message };
  }
}

export async function updateCategory(id: string, data: z.infer<typeof categorySchema>) {
  const companyId = await getCompanyId();
  if (!companyId) throw new Error("Unauthorized");

  const validation = categorySchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.flatten().fieldErrors };
  }

  try {
    await db.update(itemCategories)
      .set({
        ...validation.data,
        updatedAt: new Date(),
      })
      .where(eq(itemCategories.id, id));

    revalidatePath("/inventory/categories");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update category:", error);
    return { success: false, error: error.message };
  }
}

// ... existing code ...

// ... existing code ...

export async function deleteCategory(id: string) {
  const companyId = await getCompanyId();
  if (!companyId) throw new Error("Unauthorized");

  try {
    await db.delete(itemCategories).where(eq(itemCategories.id, id));
    revalidatePath("/inventory/categories");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete category:", error);
    return { success: false, error: "Cannot delete category in use" };
  }
}

export async function deleteCategories(ids: string[]) {
  const companyId = await getCompanyId();
  if (!companyId) throw new Error("Unauthorized");

  try {
    await db.delete(itemCategories).where(inArray(itemCategories.id, ids));
    revalidatePath("/inventory/categories");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete categories:", error);
    return { success: false, error: "Cannot delete selected categories" };
  }
}
