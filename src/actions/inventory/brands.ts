"use server";

import { db } from "@/db";
import { itemBrands } from "@/db/schema/item-hierarchy";
import { revalidatePath } from "next/cache";
import { getCompanyId } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const brandSchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  nameAr: z.string().optional(),
  website: z.string().optional(),
  isActive: z.boolean().default(true),
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

  try {
    const [newItem] = await db.insert(itemBrands).values({
      companyId,
      ...validation.data,
    }).returning();

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

  try {
    await db.update(itemBrands)
      .set({
        ...validation.data,
        updatedAt: new Date(),
      })
      .where(eq(itemBrands.id, id));

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
    await db.delete(itemBrands).where(eq(itemBrands.id, id));
    revalidatePath("/inventory/brands");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete brand:", error);
    return { success: false, error: "Cannot delete brand in use" };
  }
}
