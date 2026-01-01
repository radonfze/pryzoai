"use server";

import { db } from "@/db";
import { stockSerials } from "@/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCompanyId } from "@/lib/auth";
import { z } from "zod";

const serialSchema = z.object({
  itemId: z.string().min(1, "Item is required"),
  warehouseId: z.string().min(1, "Warehouse is required"),
  serialNumber: z.string().min(1, "Serial number is required"),
  batchId: z.string().optional().nullable(),
  status: z.enum(["available", "reserved", "sold", "returned"]).default("available"),
  receivedDate: z.date().optional().nullable(),
  warrantyEndDate: z.string().optional().nullable(),
});

export type SerialInput = z.infer<typeof serialSchema>;

export async function getSerials() {
  const companyId = await getCompanyId();
  if (!companyId) return [];

  return db.query.stockSerials.findMany({
    where: eq(stockSerials.companyId, companyId),
    with: {
      item: true,
      warehouse: true,
    },
    orderBy: [desc(stockSerials.createdAt)],
  });
}

export async function getSerialById(id: string) {
  const companyId = await getCompanyId();
  if (!companyId) return null;

  return db.query.stockSerials.findFirst({
    where: and(eq(stockSerials.id, id), eq(stockSerials.companyId, companyId)),
    with: {
      item: true,
      warehouse: true,
    },
  });
}

export async function createSerial(data: SerialInput) {
  const companyId = await getCompanyId();
  if (!companyId) return { success: false, error: "Unauthorized" };

  const validation = serialSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.flatten().fieldErrors };
  }

  try {
    const [serial] = await db.insert(stockSerials).values({
      companyId,
      itemId: validation.data.itemId,
      warehouseId: validation.data.warehouseId,
      serialNumber: validation.data.serialNumber,
      batchId: validation.data.batchId,
      status: validation.data.status,
      receivedDate: validation.data.receivedDate || new Date(),
      warrantyEndDate: validation.data.warrantyEndDate,
    }).returning();

    revalidatePath("/inventory/serials");
    return { success: true, id: serial.id };
  } catch (error: any) {
    console.error("Failed to create serial:", error);
    return { success: false, error: error.message };
  }
}

export async function updateSerialStatus(id: string, status: string, additionalData?: { 
  soldDate?: Date; 
  saleDocType?: string; 
  saleDocId?: string;
  customerId?: string;
}) {
  const companyId = await getCompanyId();
  if (!companyId) return { success: false, error: "Unauthorized" };

  try {
    await db.update(stockSerials)
      .set({
        status,
        soldDate: additionalData?.soldDate,
        saleDocType: additionalData?.saleDocType,
        saleDocId: additionalData?.saleDocId,
        customerId: additionalData?.customerId,
        warehouseId: status === "sold" ? null : undefined, // Clear warehouse when sold
      })
      .where(and(eq(stockSerials.id, id), eq(stockSerials.companyId, companyId)));

    revalidatePath("/inventory/serials");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update serial:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteSerials(ids: string[]) {
  const companyId = await getCompanyId();
  if (!companyId) return { success: false, error: "Unauthorized" };

  try {
    await db.delete(stockSerials)
      .where(and(inArray(stockSerials.id, ids), eq(stockSerials.companyId, companyId)));

    revalidatePath("/inventory/serials");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete serials:", error);
    return { success: false, error: error.message };
  }
}

// Bulk create serials (for receiving)
export async function createSerialsBulk(itemId: string, warehouseId: string, serialNumbers: string[], warrantyEndDate?: string) {
  const companyId = await getCompanyId();
  if (!companyId) return { success: false, error: "Unauthorized" };

  try {
    const serials = await db.insert(stockSerials).values(
      serialNumbers.map(sn => ({
        companyId,
        itemId,
        warehouseId,
        serialNumber: sn,
        status: "available" as const,
        receivedDate: new Date(),
        warrantyEndDate,
      }))
    ).returning();

    revalidatePath("/inventory/serials");
    return { success: true, count: serials.length };
  } catch (error: any) {
    console.error("Failed to create serials:", error);
    return { success: false, error: error.message };
  }
}
