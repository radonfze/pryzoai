"use server";

import { db } from "@/db";
import { itemCategories } from "@/db/schema/item-hierarchy";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCompanyId } from "@/lib/auth";

const categorySchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  nameAr: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export async function getCategories() {
  const companyId = await getCompanyId();
  if (!companyId) return [];

  return await db.query.itemCategories.findMany({
    where: eq(itemCategories.companyId, companyId),
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
