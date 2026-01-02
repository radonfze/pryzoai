"use server";

import { toUpperCase } from "@/lib/utils"; // Only Uppers for Model

// ... inside createModel ...
      ...validation.data,
      name: toUpperCase(validation.data.name),
      code: toUpperCase(validation.data.code),
    }).returning();

// ... inside updateModel ...
    await db.update(itemModels)
      .set({
        ...validation.data,
        name: toUpperCase(validation.data.name),
        code: toUpperCase(validation.data.code),
        updatedAt: new Date(),
      })
import { itemModels } from "@/db/schema/item-hierarchy";
import { revalidatePath } from "next/cache";
import { getCompanyId } from "@/lib/auth";
import { eq, desc, sql, inArray } from "drizzle-orm";
import { z } from "zod";

// Get next sequential model code
export async function getNextModelCode(): Promise<string> {
  const companyId = await getCompanyId();
  if (!companyId) return "MDL1";
  try {
    const countResult = await db.select({ count: sql<number>`count(*)` })
      .from(itemModels).where(eq(itemModels.companyId, companyId));
    return `MDL${Number(countResult[0]?.count || 0) + 1}`;
  } catch { return "MDL1"; }
}


const modelSchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  brandId: z.string().min(1, "Brand is required"),
  subcategoryId: z.string().min(1, "Subcategory is required"),
  nameAr: z.string().optional(),
  description: z.string().optional(),
  specifications: z.string().optional(), // Could be JSON later
  isActive: z.boolean().default(true),
});

export async function getModels() {
  const companyId = await getCompanyId();
  if (!companyId) return [];

  return db.query.itemModels.findMany({
    where: eq(itemModels.companyId, companyId),
    with: {
      brand: true,
      subcategory: true,
    },
    orderBy: [desc(itemModels.createdAt)],
  });
}

export async function getModel(id: string) {
  const companyId = await getCompanyId();
  if (!companyId) return null;

  return db.query.itemModels.findFirst({
    where: eq(itemModels.id, id),
  });
}

export async function createModel(data: z.infer<typeof modelSchema>) {
  const companyId = await getCompanyId();
  if (!companyId) throw new Error("Unauthorized");

  const validation = modelSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.flatten().fieldErrors };
  }

  try {
    const [newItem] = await db.insert(itemModels).values({
      companyId,
      ...validation.data,
      name: toUpperCase(validation.data.name),
      code: toUpperCase(validation.data.code),
    }).returning();

    revalidatePath("/inventory/models");
    return { success: true, id: newItem.id };
  } catch (error: any) {
    console.error("Failed to create model:", error);
    return { success: false, error: error.message };
  }
}

export async function updateModel(id: string, data: z.infer<typeof modelSchema>) {
  const companyId = await getCompanyId();
  if (!companyId) throw new Error("Unauthorized");

  const validation = modelSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.flatten().fieldErrors };
  }

  try {
    await db.update(itemModels)
      .set({
        ...validation.data,
        name: toUpperCase(validation.data.name),
        code: toUpperCase(validation.data.code),
        updatedAt: new Date(),
      })
      .where(eq(itemModels.id, id));

    revalidatePath("/inventory/models");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update model:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteModel(id: string) {
  const companyId = await getCompanyId();
  if (!companyId) throw new Error("Unauthorized");

  try {
    await db.delete(itemModels).where(eq(itemModels.id, id));
    revalidatePath("/inventory/models");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete model:", error);
    return { success: false, error: "Cannot delete model in use" };
  }
}

export async function deleteModels(ids: string[]) {
  const companyId = await getCompanyId();
  if (!companyId) throw new Error("Unauthorized");

  try {
    await db.delete(itemModels).where(inArray(itemModels.id, ids));
    revalidatePath("/inventory/models");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete models:", error);
    return { success: false, error: "Cannot delete selected models" };
  }
}
