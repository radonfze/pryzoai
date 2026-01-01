"use server";

import { db } from "@/db";
import { itemCategories, itemSubcategories } from "@/db/schema/item-hierarchy";
import { revalidatePath } from "next/cache";
import { getCompanyId } from "@/lib/auth";
import { eq, desc, sql } from "drizzle-orm";
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
  categoryId: z.string().min(1, "Category is required"),
  nameAr: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export async function getSubcategories() {
  const companyId = await getCompanyId();
  if (!companyId) return [];

  return await db.query.itemSubcategories.findMany({
    where: eq(itemSubcategories.companyId, companyId),
    with: {
      category: true,
    },
    orderBy: [desc(itemSubcategories.createdAt)],
  });
}

export async function getSubcategory(id: string) {
  const companyId = await getCompanyId();
  if (!companyId) return null;

  return await db.query.itemSubcategories.findFirst({
    where: eq(itemSubcategories.id, id),
  });
}

export async function createSubcategory(data: z.infer<typeof subcategorySchema>) {
  const companyId = await getCompanyId();
  if (!companyId) throw new Error("Unauthorized");

  const validation = subcategorySchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.flatten().fieldErrors };
  }

  try {
    const [newSub] = await db.insert(itemSubcategories).values({
      companyId,
      ...validation.data,
    }).returning();

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

  try {
    await db.update(itemSubcategories)
      .set({
        ...validation.data,
        updatedAt: new Date(),
      })
      .where(eq(itemSubcategories.id, id));

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
    await db.delete(itemSubcategories).where(eq(itemSubcategories.id, id));
    revalidatePath("/inventory/subcategories");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete subcategory:", error);
    return { success: false, error: "Cannot delete subcategory in use" };
  }
}
