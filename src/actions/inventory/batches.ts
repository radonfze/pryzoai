"use server";

import { db } from "@/db";
import { stockBatches } from "@/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCompanyId } from "@/lib/auth";
import { z } from "zod";

const batchSchema = z.object({
  itemId: z.string().min(1, "Item is required"),
  warehouseId: z.string().min(1, "Warehouse is required"),
  batchNumber: z.string().min(1, "Batch number is required"),
  manufacturingDate: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  quantityReceived: z.coerce.number().min(0).default(0),
  unitCost: z.coerce.number().min(0).optional(),
  isActive: z.boolean().default(true),
});

export type BatchInput = z.infer<typeof batchSchema>;

export async function getBatches() {
  const companyId = await getCompanyId();
  if (!companyId) return [];

  return db.query.stockBatches.findMany({
    where: eq(stockBatches.companyId, companyId),
    with: {
      item: true,
      warehouse: true,
    },
    orderBy: [desc(stockBatches.createdAt)],
  });
}

export async function getBatchById(id: string) {
  const companyId = await getCompanyId();
  if (!companyId) return null;

  return db.query.stockBatches.findFirst({
    where: and(eq(stockBatches.id, id), eq(stockBatches.companyId, companyId)),
    with: {
      item: true,
      warehouse: true,
    },
  });
}

export async function createBatch(data: BatchInput) {
  const companyId = await getCompanyId();
  if (!companyId) return { success: false, error: "Unauthorized" };

  const validation = batchSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.flatten().fieldErrors };
  }

  try {
    const [batch] = await db.insert(stockBatches).values({
      companyId,
      itemId: validation.data.itemId,
      warehouseId: validation.data.warehouseId,
      batchNumber: validation.data.batchNumber,
      manufacturingDate: validation.data.manufacturingDate,
      expiryDate: validation.data.expiryDate,
      quantityReceived: validation.data.quantityReceived.toString(),
      quantityOnHand: validation.data.quantityReceived.toString(),
      unitCost: validation.data.unitCost?.toString(),
      isActive: validation.data.isActive,
    }).returning();

    revalidatePath("/inventory/batches");
    return { success: true, id: batch.id };
  } catch (error: any) {
    console.error("Failed to create batch:", error);
    return { success: false, error: error.message };
  }
}

export async function updateBatch(id: string, data: Partial<BatchInput>) {
  const companyId = await getCompanyId();
  if (!companyId) return { success: false, error: "Unauthorized" };

  try {
    await db.update(stockBatches)
      .set({
        batchNumber: data.batchNumber,
        manufacturingDate: data.manufacturingDate,
        expiryDate: data.expiryDate,
        unitCost: data.unitCost?.toString(),
        isActive: data.isActive,
      })
      .where(and(eq(stockBatches.id, id), eq(stockBatches.companyId, companyId)));

    revalidatePath("/inventory/batches");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update batch:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteBatches(ids: string[]) {
  const companyId = await getCompanyId();
  if (!companyId) return { success: false, error: "Unauthorized" };

  try {
    await db.delete(stockBatches)
      .where(and(inArray(stockBatches.id, ids), eq(stockBatches.companyId, companyId)));

    revalidatePath("/inventory/batches");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete batches:", error);
    return { success: false, error: error.message };
  }
}
